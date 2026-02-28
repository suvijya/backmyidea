"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ideaLimiter } from "@/lib/redis";
import { createIdeaSchema, updateIdeaSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";
import { checkIdeaQuality, checkDuplicateIdea } from "@/lib/gemini";
import { calculateValidationScore } from "@/lib/scoring";
import { createNotification } from "./notification-actions";
import { checkAndAwardBadges, awardPoints, updateUserLevel } from "./gamification-actions";
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

  // Rate limit
  const { success: withinLimit } = await ideaLimiter.limit(user.id);
  if (!withinLimit) {
    return { success: false, error: "Too many ideas submitted. Try again later." };
  }

  // Check max active ideas
  const activeCount = await prisma.idea.count({
    where: { founderId: user.id, status: "ACTIVE" },
  });
  if (activeCount >= MAX_ACTIVE_IDEAS) {
    return {
      success: false,
      error: `You can have at most ${MAX_ACTIVE_IDEAS} active ideas. Archive one to post a new idea.`,
    };
  }

  // targetAudience is an array — use getAll
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
    imageUrl: formData.get("imageUrl") as string,
  };

  const parsed = createIdeaSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
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
    where: { status: "ACTIVE", category: data.category },
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
      founderId: user.id,
      status: "ACTIVE",
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
  const idea = await prisma.idea.findUnique({
    where: { slug },
    include: {
      founder: {
        select: { id: true, name: true, username: true, image: true, bio: true, city: true },
      },
      votes: {
        select: { id: true, type: true, userId: true },
      },
      _count: {
        select: { comments: true, votes: true },
      },
    },
  });

  if (!idea || idea.status === "REMOVED") {
    return { success: false, error: "Idea not found" };
  }

  // Increment view count (fire-and-forget)
  prisma.idea
    .update({ where: { id: idea.id }, data: { totalViews: { increment: 1 } } })
    .catch(console.error);

  return { success: true, data: idea };
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
    include: {
      founder: {
        select: { id: true, name: true, username: true, image: true },
      },
      votes: {
        select: { type: true, userId: true },
      },
    },
    orderBy,
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = ideas.length > FEED_PAGE_SIZE;
  const items = hasMore ? ideas.slice(0, FEED_PAGE_SIZE) : ideas;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor, hasMore };
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
}

// ═══════════════════════════════
// INCREMENT SHARE COUNT
// ═══════════════════════════════

export async function incrementShareCount(
  ideaId: string
): Promise<ActionResult> {
  try {
    await prisma.idea.update({
      where: { id: ideaId },
      data: { totalShares: { increment: 1 } },
    });
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
  const ideas = await prisma.idea.findMany({
    where: { founderId: userId, status: { not: "REMOVED" } },
    include: {
      founder: {
        select: { id: true, name: true, username: true, image: true },
      },
      votes: {
        select: { type: true, userId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ideas;
}
