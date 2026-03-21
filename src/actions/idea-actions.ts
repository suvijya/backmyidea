"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redis, ideaLimiter, shareLimiter } from "@/lib/redis";
import { createIdeaSchema, updateIdeaSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";
import { checkIdeaQuality, checkDuplicateIdea } from "@/lib/gemini";
import { calculateValidationScore } from "@/lib/scoring";

import { checkAndAwardBadges, awardPoints, updateUserLevel } from "@/lib/gamification";
import { trackDailyStat, snapshotDailyScore } from "@/lib/daily-stats";
import { MAX_ACTIVE_IDEAS } from "@/lib/constants";
import type { ActionResult, IdeaFeedItem, IdeaDetail, PaginatedResponse, IdeaFilters, AIQualityResult, AIDuplicateResult } from "@/types";
import type { Idea, IdeaStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { FEED_PAGE_SIZE } from "@/lib/constants";

// ═══════════════════════════════
// CREATE IDEA
// ═══════════════════════════════

export async function createIdea(
  formData: FormData
): Promise<ActionResult<Idea & { qualityResult: AIQualityResult | null; duplicateResult: AIDuplicateResult | null }>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || !user.onboarded) {
    return { success: false, error: "Complete onboarding first" };
  }

  // Parse and validate input BEFORE rate limiting so bad input doesn't burn tokens
  const targetAudienceRaw = formData.getAll("targetAudience") as string[];
  const tagsRaw = formData.getAll("tags") as string[];

  const raw = {
    title: formData.get("title") as string,
    pitch: formData.get("pitch") as string,
    problem: formData.get("problem") as string,
    solution: formData.get("solution") as string,
    category: formData.get("category") as string,
    stage: formData.get("stage") as string,
    targetAudience: targetAudienceRaw,
    feedbackQuestion: formData.get("feedbackQuestion") as string,
    linkUrl: formData.get("linkUrl") as string,
    tags: tagsRaw,
    imageUrl: (formData.get("imageUrl") as string) || undefined,
  };

  // Read donationsEnabled separately (not part of Zod content schema)
  const donationsEnabled = formData.get("donationsEnabled") === "true";

  const parsed = createIdeaSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  // Rate limit (after validation so failed parses don't waste tokens)
  const { success: withinLimit } = await ideaLimiter.limit(user.id);
  if (!withinLimit) {
    return { success: false, error: "Too many ideas submitted. Try again later." };
  }

  // Check max active ideas
  const activeCount = await prisma.idea.count({
    where: { founderId: user.id, status: { in: ["ACTIVE", "PENDING"] } },
  });
  if (activeCount >= MAX_ACTIVE_IDEAS) {
    return {
      success: false,
      error: `You can have at most ${MAX_ACTIVE_IDEAS} active ideas. Archive one to post a new idea.`,
    };
  }

  const data = parsed.data;
  const slug = generateSlug(data.title);

  // AI quality check (non-blocking for the user, but we await it for the result)
  const qualityResult = await checkIdeaQuality({
    title: data.title,
    pitch: data.pitch,
    problem: data.problem,
    solution: data.solution,
    category: data.category,
  });

  // AI says spam → block
  if (qualityResult?.isSpam) {
    return {
      success: false,
      error: "This idea was flagged as spam. Please revise and try again.",
    };
  }

  // AI duplicate check
  const existingIdeas = await prisma.idea.findMany({
    where: { status: { in: ["ACTIVE", "PENDING"] }, category: data.category },
    select: { id: true, title: true, slug: true, pitch: true },
    take: 50,
    orderBy: { totalVotes: "desc" },
  });

  const duplicateResult = await checkDuplicateIdea(
    data.title,
    data.pitch,
    existingIdeas
  );

  // Create the idea
  const idea = await prisma.idea.create({
    data: {
      slug,
      title: data.title,
      pitch: data.pitch,
      problem: data.problem,
      solution: data.solution,
      category: data.category,
      stage: data.stage,
      targetAudience: data.targetAudience,
      feedbackQuestion: data.feedbackQuestion || null,
      linkUrl: data.linkUrl || null,
      tags: data.tags ?? [],
      imageUrl: data.imageUrl || null,
      qualityScore: qualityResult?.score ?? null,
      aiChecked: qualityResult !== null,
      isDuplicate: duplicateResult?.isDuplicate ?? false,
      donationsEnabled,
      founderId: user.id,
      status: "PENDING",
    },
  });

  // Fire-and-forget gamification
  awardPoints(user.id, "IDEA_POSTED").catch(console.error);
  checkAndAwardBadges(user.id).catch(console.error);
  updateUserLevel(user.id).catch(console.error);

  revalidatePath("/explore");
  revalidatePath("/dashboard/ideas");
  revalidatePath("/");

  return {
    success: true,
    data: { ...idea, qualityResult, duplicateResult },
  };
}

// ═══════════════════════════════
// UPDATE IDEA
// ═══════════════════════════════

export async function updateIdea(
  ideaId: string,
  formData: FormData
): Promise<ActionResult<Idea>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return { success: false, error: "Idea not found" };
  }

  if (idea.founderId !== user.id) {
    return { success: false, error: "You can only edit your own ideas" };
  }

  const targetAudienceRaw = formData.getAll("targetAudience") as string[];
  const tagsRaw = formData.getAll("tags") as string[];

  const raw: Record<string, unknown> = {};
  const title = formData.get("title");
  if (title) raw.title = title;
  const pitch = formData.get("pitch");
  if (pitch) raw.pitch = pitch;
  const problem = formData.get("problem");
  if (problem) raw.problem = problem;
  const solution = formData.get("solution");
  if (solution) raw.solution = solution;
  const category = formData.get("category");
  if (category) raw.category = category;
  const stage = formData.get("stage");
  if (stage) raw.stage = stage;
  if (targetAudienceRaw.length > 0) raw.targetAudience = targetAudienceRaw;
  const feedbackQuestion = formData.get("feedbackQuestion");
  if (feedbackQuestion !== null) raw.feedbackQuestion = feedbackQuestion;
  const linkUrl = formData.get("linkUrl");
  if (linkUrl !== null) raw.linkUrl = linkUrl;
  if (tagsRaw.length > 0) raw.tags = tagsRaw;
  const imageUrl = formData.get("imageUrl");
  if (imageUrl !== null) raw.imageUrl = imageUrl;

  const parsed = updateIdeaSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  const updateData: Prisma.IdeaUpdateInput = {
    ...parsed.data,
    editedAt: new Date(),
  };

  // Handle empty string → null conversions
  if (parsed.data.feedbackQuestion === "") updateData.feedbackQuestion = null;
  if (parsed.data.linkUrl === "") updateData.linkUrl = null;
  if (parsed.data.imageUrl === "") updateData.imageUrl = null;

  const updated = await prisma.idea.update({
    where: { id: ideaId },
    data: updateData,
  });

  revalidatePath(`/idea/${updated.slug}`);
  revalidatePath("/dashboard/ideas");
  return { success: true, data: updated };
}

// ═══════════════════════════════
// DELETE / ARCHIVE IDEA
// ═══════════════════════════════

export async function updateIdeaStatus(
  ideaId: string,
  status: IdeaStatus
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return { success: false, error: "Idea not found" };
  }

  if (idea.founderId !== user.id && !user.isAdmin) {
    return { success: false, error: "Not authorized" };
  }

  await prisma.idea.update({
    where: { id: ideaId },
    data: { status },
  });

  revalidatePath(`/idea/${idea.slug}`);
  revalidatePath("/explore");
  revalidatePath("/dashboard/ideas");
  return { success: true, data: undefined };
}

// ═══════════════════════════════
// GET IDEA BY SLUG (detail page)
// ═══════════════════════════════

export async function getIdeaBySlug(
  slug: string
): Promise<ActionResult<IdeaDetail>> {
  const { userId: clerkId } = await auth();

  let currentUserId: string | null = null;
  let isAdminOrEmployee = false;

  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, isAdmin: true, isEmployee: true },
    });
    if (user) {
      currentUserId = user.id;
      isAdminOrEmployee = user.isAdmin || user.isEmployee;
    }
  }

  const idea = await prisma.idea.findUnique({
    where: { slug },
    include: {
      founder: {
        select: { id: true, name: true, username: true, image: true, bio: true, city: true },
      },
      votes: currentUserId ? {
        where: { userId: currentUserId },
        select: { id: true, type: true, userId: true },
      } : false,
      _count: {
        select: { comments: true, votes: true },
      },
    },
  });

  if (!idea || idea.status === "REMOVED") {
    return { success: false, error: "Idea not found" };
  }

  // If idea is not active, restrict access
  if (idea.status !== "ACTIVE") {
    const isFounder = currentUserId && idea.founder.id === currentUserId;
    const canView = isFounder || isAdminOrEmployee;

    if (!canView) {
      return { success: false, error: "Idea not found" };
    }
  }

  // Ensure votes array is present
  const data = {
    ...idea,
    votes: idea.votes || []
  };

  // Increment view count (fire-and-forget)
  prisma.idea
    .update({ where: { id: idea.id }, data: { totalViews: { increment: 1 } } })
    .catch(console.error);
  trackDailyStat(idea.id, "views").catch(console.error);

  return { success: true, data };
}

// ═══════════════════════════════
// GET IDEA BY ID (for editing)
// ═══════════════════════════════

export async function getIdeaById(
  ideaId: string
): Promise<ActionResult<Idea>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return { success: false, error: "Idea not found" };
  }

  if (idea.founderId !== user.id && !user.isAdmin) {
    return { success: false, error: "Not authorized" };
  }

  return { success: true, data: idea };
}

// ═══════════════════════════════
// GET IDEAS FEED (paginated, filtered)
// ═══════════════════════════════

export async function getIdeasFeed(
  filters: IdeaFilters,
  cursor?: string
): Promise<PaginatedResponse<IdeaFeedItem>> {
  const { userId: clerkId } = await auth();
  let currentUserId: string | null = null;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (user) currentUserId = user.id;
  }

  const where: Prisma.IdeaWhereInput = {
    status: "ACTIVE",
  };

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.stage) {
    where.stage = filters.stage;
  }
  if (filters.targetAudience) {
    where.targetAudience = { has: filters.targetAudience };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { pitch: { contains: filters.search, mode: "insensitive" } },
      { tags: { has: filters.search.toLowerCase() } },
    ];
  }

  // Determine sort order
  let orderBy: Prisma.IdeaOrderByWithRelationInput;
  switch (filters.sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "top":
      orderBy = { validationScore: "desc" };
      break;
    case "hot":
      orderBy = { totalVotes: "desc" };
      break;
    case "trending":
    default:
      // Trending = combination of recency and votes
      orderBy = { totalVotes: "desc" };
      break;
  }

  const ideas = await prisma.idea.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      pitch: true,
      category: true,
      stage: true,
      validationScore: true,
      scoreTier: true,
      createdAt: true,
      useThisCount: true,
      maybeCount: true,
      notForMeCount: true,
      totalVotes: true,
      totalComments: true,
      totalViews: true,
      totalShares: true,
      imageUrl: true,
      status: true,
      founderId: true,
      updatedAt: true,
      founder: {
        select: { id: true, name: true, username: true, image: true },
      },
      votes: currentUserId ? {
        where: { userId: currentUserId },
        select: { type: true, userId: true },
      } : false,
    },
    orderBy,
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const formattedIdeas = ideas.map(idea => ({
    ...idea,
    votes: idea.votes || []
  }));

  const hasMore = formattedIdeas.length > FEED_PAGE_SIZE;
  const items = hasMore ? formattedIdeas.slice(0, FEED_PAGE_SIZE) : formattedIdeas;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor, hasMore };
}

export async function getExploreFeed(
  filters: IdeaFilters,
  page: number = 1
): Promise<{ items: IdeaFeedItem[]; totalPages: number; currentPage: number; totalCount: number }> {
  const { userId: clerkId } = await auth();
  let currentUserId: string | null = null;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (user) currentUserId = user.id;
  }

  const where: Prisma.IdeaWhereInput = {
    status: "ACTIVE",
  };

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.stage) {
    where.stage = filters.stage;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { pitch: { contains: filters.search, mode: "insensitive" } },
      { tags: { has: filters.search.toLowerCase() } },
    ];
  }

  let orderBy: Prisma.IdeaOrderByWithRelationInput;
  switch (filters.sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "top":
      orderBy = { validationScore: "desc" };
      break;
    case "hot":
      orderBy = { totalVotes: "desc" };
      break;
    case "trending":
    default:
      orderBy = { totalVotes: "desc" };
      break;
  }

  const limit = FEED_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const [totalCount, ideas] = await prisma.$transaction([
    prisma.idea.count({ where }),
    prisma.idea.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        pitch: true,
        category: true,
        stage: true,
        validationScore: true,
        scoreTier: true,
        createdAt: true,
        useThisCount: true,
        maybeCount: true,
        notForMeCount: true,
        totalVotes: true,
        totalComments: true,
        totalViews: true,
        totalShares: true,
        imageUrl: true,
        status: true,
        founderId: true,
        updatedAt: true,
        founder: {
          select: { id: true, name: true, username: true, image: true },
        },
        votes: currentUserId ? {
          where: { userId: currentUserId },
          select: { type: true, userId: true },
        } : false,
      },
      orderBy,
      take: limit,
      skip,
    })
  ]);

  const formattedIdeas = ideas.map(idea => ({
    ...idea,
    votes: idea.votes || []
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return { items: formattedIdeas as IdeaFeedItem[], totalPages, currentPage: page, totalCount };
}

// ═══════════════════════════════
// RECALCULATE SCORE (fire-and-forget)
// ═══════════════════════════════

export async function recalculateScore(ideaId: string): Promise<void> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: {
      totalVotes: true,
      useThisCount: true,
      maybeCount: true,
      notForMeCount: true,
      totalComments: true,
      totalViews: true,
      totalShares: true,
      qualityScore: true,
    },
  });

  if (!idea) return;

  const { totalScore, tier } = calculateValidationScore(idea);

  await prisma.idea.update({
    where: { id: ideaId },
    data: {
      validationScore: totalScore,
      scoreTier: tier,
    },
  });

  // Snapshot daily score for analytics charts
  snapshotDailyScore(ideaId, totalScore).catch(console.error);
}

// ═══════════════════════════════
// INCREMENT SHARE COUNT
// ═══════════════════════════════

export async function incrementShareCount(
  ideaId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  // Rate limit
  const { success: withinLimit } = await shareLimiter.limit(user.id);
  if (!withinLimit) {
    return { success: false, error: "Too many shares. Try again later." };
  }

  try {
    await prisma.idea.update({
      where: { id: ideaId },
      data: { totalShares: { increment: 1 } },
    });
    trackDailyStat(ideaId, "shares").catch(console.error);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update share count" };
  }
}

// ═══════════════════════════════
// GET IDEAS BY USER
// ═══════════════════════════════

export async function getIdeasByUser(
  userId: string
): Promise<IdeaFeedItem[]> {
  // Determine if current user is the owner — if not, only show ACTIVE ideas
  const { userId: clerkId } = await auth();
  let isOwner = false;
  let currentUserId: string | null = null;
  if (clerkId) {
    const currentUser = await prisma.user.findUnique({ where: { clerkId }, select: { id: true, isAdmin: true } });
    if (currentUser) {
      currentUserId = currentUser.id;
      isOwner = currentUser.id === userId || currentUser.isAdmin === true;
    }
  }

  const statusFilter: Prisma.IdeaWhereInput["status"] = isOwner
    ? { not: "REMOVED" }
    : "ACTIVE";

  const ideas = await prisma.idea.findMany({
    where: { founderId: userId, status: statusFilter },
    select: {
      id: true,
      slug: true,
      title: true,
      pitch: true,
      category: true,
      stage: true,
      validationScore: true,
      scoreTier: true,
      createdAt: true,
      useThisCount: true,
      maybeCount: true,
      notForMeCount: true,
      totalVotes: true,
      totalComments: true,
      totalViews: true,
      totalShares: true,
      imageUrl: true,
      status: true,
      founderId: true,
      updatedAt: true,
      founder: {
        select: { id: true, name: true, username: true, image: true },
      },
      votes: currentUserId ? {
        where: { userId: currentUserId },
        select: { type: true, userId: true },
      } : false,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedIdeas = ideas.map(idea => ({
    ...idea,
    votes: idea.votes || []
  }));

  return formattedIdeas as IdeaFeedItem[];
}

// ═══════════════════════════════
// EXPLORE SIDEBAR & TRENDING (cached)
// ═══════════════════════════════

export async function getExploreSidebarData() {
  const cacheKey = "explore:sidebar_stats";
  try {
    const cached = await redis.get<any>(cacheKey);
    if (cached) return cached;
  } catch (err) {
    console.error("Redis error in getExploreSidebarData:", err);
  }

  const [activeVotersCount, ideasTodayCount, topValidatorRaw] = await Promise.all([
    prisma.user.count({ where: { votes: { some: {} } } }),
    prisma.idea.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: "ACTIVE",
      },
    }),
    prisma.user.findFirst({
      orderBy: { points: "desc" },
      where: { onboarded: true, isBanned: false },
      select: {
        name: true,
        username: true,
        image: true,
        level: true,
        _count: { select: { votes: true } },
      },
    }),
  ]);

  const stats = {
    activeVoters: activeVotersCount,
    ideasToday: ideasTodayCount,
    topValidator: topValidatorRaw ? {
      name: topValidatorRaw.name,
      username: topValidatorRaw.username || "",
      image: topValidatorRaw.image,
      level: topValidatorRaw.level,
      reviewCount: topValidatorRaw._count.votes,
    } : null,
  };

  try {
    await redis.set(cacheKey, stats, { ex: 300 }); // 5 minutes cache
  } catch (err) {
    console.error("Redis set error in getExploreSidebarData:", err);
  }
  
  return stats;
}

export async function getTrendingTopics() {
  const cacheKey = "explore:trending_topics";
  try {
    const cached = await redis.get<any[]>(cacheKey);
    if (cached) return cached;
  } catch (err) {
    console.error("Redis error in getTrendingTopics:", err);
  }

  const recentIdeas = await prisma.idea.findMany({
    where: { status: "ACTIVE" },
    select: { tags: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tagCounts: Record<string, number> = {};
  recentIdeas.forEach((idea) => {
    if (idea.tags && idea.tags.length > 0) {
      idea.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    } else {
      const cat = idea.category.toLowerCase().replace(/_/g, "-");
      tagCounts[cat] = (tagCounts[cat] || 0) + 1;
    }
  });

  const trendingTopics = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  try {
    if (trendingTopics.length > 0) {
      await redis.set(cacheKey, trendingTopics, { ex: 1800 }); // 30 minutes cache
    }
  } catch (err) {
    console.error("Redis set error in getTrendingTopics:", err);
  }

  return trendingTopics;
}
