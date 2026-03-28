"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ideaLimiter, shareLimiter, redis } from "@/lib/redis";
import { createIdeaSchema, updateIdeaSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";
import { checkIdeaQuality, checkDuplicateIdea } from "@/lib/gemini";
import { calculateValidationScore } from "@/lib/scoring";

import { checkAndAwardBadges, awardPoints, updateUserLevel } from "@/lib/gamification";
import { trackDailyStat, snapshotDailyScore } from "@/lib/daily-stats";
import { MAX_ACTIVE_IDEAS } from "@/lib/constants";
import type { ActionResult, IdeaFeedItem, IdeaDetail, PaginatedResponse, IdeaFilters, AIQualityResult, AIDuplicateResult } from "@/types";
import type { Idea, IdeaStatus, Prisma, VoteType } from "@prisma/client";
import { revalidatePath, unstable_cache } from "next/cache";
import { FEED_PAGE_SIZE } from "@/lib/constants";

const STALE_RESEARCH_GENERATION_MS = 20 * 60 * 1000;

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

  const user = await getCachedUserPermissions(clerkId);
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

  const user = await getCachedUserPermissions(clerkId);
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

  const user = await getCachedUserPermissions(clerkId);
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
  let isPrivileged = false;
  
  if (clerkId) {
    const u = await getCachedUserPermissions(clerkId);
    if (u) {
      currentUserId = u.id;
      isPrivileged = u.isAdmin || u.isEmployee;
    }
  }

  const idea = await prisma.idea.findUnique({
    where: { slug },
    include: {
      research: true,
      founder: {
        select: { id: true, name: true, username: true, image: true, bio: true, city: true },
      },
      votes: clerkId ? {
        where: { user: { clerkId } },
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
    const canView = isFounder || isPrivileged;

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
): Promise<ActionResult<Idea & { research?: any }>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await getCachedUserPermissions(clerkId);
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const idea = await prisma.idea.findUnique({ 
    where: { id: ideaId },
    include: { research: true }
  });
  if (!idea) {
    return { success: false, error: "Idea not found" };
  }

  if (idea.founderId !== user.id && !user.isAdmin) {
    return { success: false, error: "Not authorized" };
  }

  if (idea.research?.status === "GENERATING") {
    const isStale = Date.now() - new Date(idea.research.generatedAt).getTime() > STALE_RESEARCH_GENERATION_MS;
    if (isStale) {
      const recovered = await prisma.ideaResearch.update({
        where: { id: idea.research.id },
        data: {
          status: "FAILED",
          error: "Auto-marked stale generation after timeout",
        },
      });

      return {
        success: true,
        data: {
          ...idea,
          research: recovered,
        },
      };
    }
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

  // Create a stable cache key
  const cacheKey = JSON.stringify({ ...filters, cursor: cursor || "start" });

  const getCachedBaseData = unstable_cache(
    async (cacheFilters: IdeaFilters, cacheCursor?: string) => {
      const where: Prisma.IdeaWhereInput = {
        status: "ACTIVE",
      };

      if (cacheFilters.category) {
        where.category = cacheFilters.category;
      }
      if (cacheFilters.stage) {
        where.stage = cacheFilters.stage;
      }
      if (cacheFilters.targetAudience) {
        where.targetAudience = { has: cacheFilters.targetAudience };
      }
      if (cacheFilters.search) {
        where.OR = [
          { title: { contains: cacheFilters.search, mode: "insensitive" } },
          { pitch: { contains: cacheFilters.search, mode: "insensitive" } },
          { tags: { has: cacheFilters.search.toLowerCase() } },
        ];
      }

      // Determine sort order
      let orderBy: Prisma.IdeaOrderByWithRelationInput;
      switch (cacheFilters.sort) {
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

      const ideas = await prisma.idea.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          pitch: true,
          category: true,
          stage: true,
          totalVotes: true,
          totalComments: true,
          totalViews: true,
          totalShares: true,
          useThisCount: true,
          maybeCount: true,
          notForMeCount: true,
          validationScore: true,
          scoreTier: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          editedAt: true,
          founder: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy,
        take: FEED_PAGE_SIZE + 1,
        ...(cacheCursor ? { cursor: { id: cacheCursor }, skip: 1 } : {}),
      });

      return ideas;
    },
    [`ideas-feed-${cacheKey}`],
    { revalidate: 30, tags: ["ideas-feed"] }
  );

  const baseIdeas = await getCachedBaseData(filters, cursor);

  // If user is logged in, fetch their votes for these specific ideas
  let userVotes: Record<string, { type: VoteType; userId: string }> = {};
  if (clerkId && baseIdeas.length > 0) {
    const ideaIds = baseIdeas.map((idea: any) => idea.id);
    const votes = await prisma.vote.findMany({
      where: {
        user: { clerkId },
        ideaId: { in: ideaIds },
      },
      select: { ideaId: true, type: true, userId: true },
    });
    
    votes.forEach((v: any) => {
      userVotes[v.ideaId] = { type: v.type, userId: v.userId };
    });
  }

  const formattedIdeas = baseIdeas.map((idea: any) => ({
    ...idea,
    votes: userVotes[idea.id] ? [userVotes[idea.id]] : [],
  }));

  const hasMore = formattedIdeas.length > FEED_PAGE_SIZE;
  const items = hasMore ? formattedIdeas.slice(0, FEED_PAGE_SIZE) : formattedIdeas;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items: items as unknown as IdeaFeedItem[], nextCursor, hasMore };
}

import { getCurrentUser, getCachedUserPermissions } from "@/lib/clerk";

export async function getExploreFeed(
  filters: IdeaFilters,
  page: number = 1
): Promise<{ items: IdeaFeedItem[]; totalPages: number; currentPage: number; totalCount: number }> {
  const { userId: clerkId } = await auth();

  // Create a stable cache key string based on filters and page
  const cacheKey = JSON.stringify({ ...filters, page });

  // Use unstable_cache to cache the expensive count and fetch query for 60 seconds
  const getCachedBaseData = unstable_cache(
    async (cacheFilters: IdeaFilters, cachePage: number) => {
      const where: Prisma.IdeaWhereInput = {
        status: "ACTIVE",
      };

      if (cacheFilters.category) {
        where.category = cacheFilters.category;
      }
      if (cacheFilters.stage) {
        where.stage = cacheFilters.stage;
      }
      if (cacheFilters.search) {
        where.OR = [
          { title: { contains: cacheFilters.search, mode: "insensitive" } },
          { pitch: { contains: cacheFilters.search, mode: "insensitive" } },
          { tags: { has: cacheFilters.search.toLowerCase() } },
        ];
      }

      let orderBy: Prisma.IdeaOrderByWithRelationInput;
      switch (cacheFilters.sort) {
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
      const skip = (cachePage - 1) * limit;

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
            totalVotes: true,
            totalComments: true,
            totalViews: true,
            totalShares: true,
            useThisCount: true,
            maybeCount: true,
            notForMeCount: true,
            validationScore: true,
            scoreTier: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            editedAt: true,
            founder: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
          orderBy,
          take: limit,
          skip,
        }),
      ]);

      return { totalCount, ideas };
    },
    [`explore-feed-${cacheKey}`],
    { revalidate: 60, tags: ["explore-feed"] }
  );

  const { totalCount, ideas: baseIdeas } = await getCachedBaseData(filters, page) as {
    totalCount: number;
    ideas: any[];
  };

  // If user is logged in, fetch their votes for these specific ideas
  let userVotes: Record<string, { type: VoteType; userId: string }> = {};
  if (clerkId && baseIdeas.length > 0) {
    const ideaIds = baseIdeas.map((idea: any) => idea.id);
    const votes = await prisma.vote.findMany({
      where: {
        user: { clerkId },
        ideaId: { in: ideaIds },
      },
      select: { ideaId: true, type: true, userId: true },
    });
    
    votes.forEach((v: any) => {
      userVotes[v.ideaId] = { type: v.type, userId: v.userId };
    });
  }

  const formattedIdeas = baseIdeas.map((idea: any) => ({
    ...idea,
    votes: userVotes[idea.id] ? [userVotes[idea.id]] : [],
  }));

  const totalPages = Math.ceil(totalCount / FEED_PAGE_SIZE);

  return {
    items: formattedIdeas as unknown as IdeaFeedItem[],
    totalPages,
    currentPage: page,
    totalCount,
  };
}

// ═══════════════════════════════
// RECALCULATE SCORE (fire-and-forget)
// ═══════════════════════════════

export async function recalculateScore(ideaId: string): Promise<void> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: {
      id: true,
      founderId: true,
      totalVotes: true,
      useThisCount: true,
      maybeCount: true,
      notForMeCount: true,
      totalComments: true,
      totalViews: true,
      totalShares: true,
      qualityScore: true,
      imageUrl: true,
      linkUrl: true,
      founder: {
        select: {
          bio: true,
          city: true,
          linkedinUrl: true,
        },
      },
      _count: {
        select: {
          reports: {
            where: {
              reason: "OTHER",
              details: { startsWith: "Suspicious" },
            },
          },
        },
      },
    },
  });

  if (!idea) return;

  const founderComments = await prisma.comment.count({
    where: { ideaId, userId: idea.founderId },
  });

  let profileCompleteness = 0.5; // base
  if (idea.founder.bio) profileCompleteness += 0.2;
  if (idea.founder.city) profileCompleteness += 0.1;
  if (idea.founder.linkedinUrl) profileCompleteness += 0.2;

  const input = {
    ...idea,
    founderComments,
    hasImageOrLink: !!(idea.imageUrl || idea.linkUrl),
    profileCompleteness,
    isSuspicious: idea._count.reports > 0,
  };

  const { totalScore, tier } = calculateValidationScore(input);

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

  const user = await getCachedUserPermissions(clerkId);
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const cacheKey = `shared:${user.id}:${ideaId}`;
  
  try {
    const alreadyShared = await redis.get(cacheKey);
    if (alreadyShared) {
      return { success: true, data: undefined };
    }
  } catch {
    // ignore redis error on fetch
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
    
    try {
      await redis.set(cacheKey, "1", { ex: 60 * 60 * 24 * 30 }); // Expiry 30 days
    } catch {
      // ignore redis error
    }
    
    // Recalculate score after share to boost engagement score
    recalculateScore(ideaId).catch(console.error);
    
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
  if (clerkId) {
    const user = await getCachedUserPermissions(clerkId);
    if (user && (user.id === userId || user.isAdmin)) {
      isOwner = true;
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
      totalVotes: true,
      totalComments: true,
      totalViews: true,
      totalShares: true,
      useThisCount: true,
      maybeCount: true,
      notForMeCount: true,
      validationScore: true,
      scoreTier: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      editedAt: true,
      founder: {
        select: { id: true, name: true, username: true, image: true },
      },
      votes: clerkId ? {
        where: { user: { clerkId } },
        select: { type: true, userId: true },
      } : false,
    },
    orderBy: { createdAt: "desc" },
  });

  return ideas.map((idea: any) => ({
    ...idea,
    votes: idea.votes || []
  }));
}
