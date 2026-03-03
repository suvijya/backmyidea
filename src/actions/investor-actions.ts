"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireUser, requireAdmin } from "@/lib/clerk";
import { revalidatePath } from "next/cache";
import { createNotificationInternal } from "@/lib/notifications";
import { investorRequestSchema, watchlistSchema, expressInterestSchema } from "@/lib/validations";
import type { ActionResult } from "@/types";
import type {
  InvestorRequestStatus,
  WatchlistStatus,
  InterestStatus,
} from "@prisma/client";

// ═══════════════════════════════
// INVESTOR REQUEST — Submit
// ═══════════════════════════════

export async function submitInvestorRequest(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  // Check if already has an approved profile
  const existingProfile = await prisma.investorProfile.findUnique({
    where: { userId: user.id },
  });
  if (existingProfile) {
    return { success: false, error: "You already have an approved investor profile" };
  }

  // Check if already has a pending request
  const existingRequest = await prisma.investorRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (existingRequest) {
    return { success: false, error: "You already have a pending request" };
  }

  const raw = {
    firmName: formData.get("firmName") as string,
    linkedinUrl: formData.get("linkedinUrl") as string,
    investmentThesis: formData.get("investmentThesis") as string,
    sectorInterests: formData.getAll("sectorInterests") as string[],
    stagePreference: formData.get("stagePreference") as string,
    ticketSizeMin: formData.get("ticketSizeMin") ? Number(formData.get("ticketSizeMin")) : undefined,
    ticketSizeMax: formData.get("ticketSizeMax") ? Number(formData.get("ticketSizeMax")) : undefined,
    portfolioCompanies: formData.get("portfolioCompanies") as string,
    website: formData.get("website") as string,
  };

  const parsed = investorRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.investorRequest.create({
    data: {
      userId: user.id,
      firmName: parsed.data.firmName || null,
      linkedinUrl: parsed.data.linkedinUrl,
      investmentThesis: parsed.data.investmentThesis,
      sectorInterests: parsed.data.sectorInterests,
      stagePreference: parsed.data.stagePreference,
      ticketSizeMin: parsed.data.ticketSizeMin ?? null,
      ticketSizeMax: parsed.data.ticketSizeMax ?? null,
      portfolioCompanies: parsed.data.portfolioCompanies || null,
      website: parsed.data.website || null,
    },
  });

  revalidatePath("/investor/apply");
  return { success: true, data: undefined };
}

// ═══════════════════════════════
// INVESTOR REQUEST — Admin Review
// ═══════════════════════════════

export async function reviewInvestorRequest(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  reviewNote?: string
): Promise<ActionResult> {
  await requireAdmin();

  if (!requestId || typeof requestId !== "string") {
    return { success: false, error: "Invalid request ID" };
  }
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return { success: false, error: "Invalid decision" };
  }

  const request = await prisma.investorRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return { success: false, error: "Request not found" };
  }

  if (request.status !== "PENDING") {
    return { success: false, error: "Request already reviewed" };
  }

  // Atomically update request + create profile (if approved)
  await prisma.$transaction(async (tx) => {
    await tx.investorRequest.update({
      where: { id: requestId },
      data: {
        status: decision,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    });

    if (decision === "APPROVED") {
      const existing = await tx.investorProfile.findUnique({
        where: { userId: request.userId },
      });

      if (!existing) {
        await tx.investorProfile.create({
          data: {
            userId: request.userId,
            firmName: request.firmName,
            linkedinUrl: request.linkedinUrl,
            investmentThesis: request.investmentThesis,
            sectorInterests: request.sectorInterests,
            stagePreference: request.stagePreference,
            ticketSizeMin: request.ticketSizeMin,
            ticketSizeMax: request.ticketSizeMax,
            portfolioCompanies: request.portfolioCompanies,
            website: request.website,
          },
        });
      }
    }
  });

  // Send notifications outside transaction (fire-and-forget)
  if (decision === "APPROVED") {
    createNotificationInternal({
      userId: request.userId,
      type: "SYSTEM",
      title: "You're Piqd!",
      body: "Your investor access request has been approved! You can now access the investor dashboard.",
      data: { link: "/investor" },
    }).catch(console.error);
  } else {
    createNotificationInternal({
      userId: request.userId,
      type: "SYSTEM",
      title: "Investor Access Update",
      body: reviewNote
        ? `Your investor access request was not approved. Reason: ${reviewNote}`
        : "Your investor access request was not approved at this time. You can reapply later.",
      data: { link: "/investor/apply" },
    }).catch(console.error);
  }

  revalidatePath("/admin/investors");
  return { success: true, data: undefined };
}

// ═══════════════════════════════
// INVESTOR REQUEST — Get Status
// ═══════════════════════════════

export async function getMyInvestorStatus(): Promise<
  ActionResult<{
    hasProfile: boolean;
    hasPendingRequest: boolean;
    lastRequestStatus: InvestorRequestStatus | null;
  }>
> {
  const user = await requireUser();

  const profile = await prisma.investorProfile.findUnique({
    where: { userId: user.id },
  });

  const latestRequest = await prisma.investorRequest.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: {
      hasProfile: !!profile,
      hasPendingRequest: latestRequest?.status === "PENDING",
      lastRequestStatus: latestRequest?.status ?? null,
    },
  };
}

// ═══════════════════════════════
// REQUIRE INVESTOR (helper)
// ═══════════════════════════════

async function requireInvestor() {
  const user = await requireUser();
  const profile = await prisma.investorProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    throw new Error("Investor access required");
  }
  return { user, profile };
}

// ═══════════════════════════════
// DEAL FLOW — Get Ideas for Investor
// ═══════════════════════════════

export async function getInvestorDealFlow(params: {
  category?: string;
  stage?: string;
  minScore?: number;
  minVotes?: number;
  sort?: string;
  cursor?: string;
}): Promise<
  ActionResult<{
    ideas: Array<{
      id: string;
      slug: string;
      title: string;
      pitch: string;
      problem: string;
      solution: string;
      category: string;
      stage: string;
      status: string;
      totalVotes: number;
      totalViews: number;
      totalComments: number;
      validationScore: number;
      scoreTier: string;
      useThisCount: number;
      maybeCount: number;
      notForMeCount: number;
      createdAt: Date;
      founder: { id: string; name: string; username: string | null; image: string | null; bio: string | null; city: string | null };
      _count: { votes: number; comments: number; watchlistItems: number };
    }>;
    hasMore: boolean;
    nextCursor: string | null;
  }>
> {
  const { profile } = await requireInvestor();

  const take = 20;
  const where: Prisma.IdeaWhereInput = {
    status: "ACTIVE",
  };

  // Apply filters
  if (params.category) {
    where.category = params.category as Prisma.EnumCategoryFilter;
  } else if (profile.sectorInterests.length > 0) {
    // Default to investor's sector interests
    where.category = { in: profile.sectorInterests as Prisma.EnumCategoryFilter["in"] };
  }

  if (params.stage) {
    where.stage = params.stage as Prisma.EnumIdeaStageFilter;
  }

  // Build totalVotes constraint — merge minScore requirement (10+ votes) with explicit minVotes
  let minVotesRequired = 0;
  if (params.minScore) {
    where.validationScore = { gte: params.minScore };
    minVotesRequired = 10; // Score only valid at 10+ votes
  }
  if (params.minVotes) {
    minVotesRequired = Math.max(minVotesRequired, params.minVotes);
  }
  if (minVotesRequired > 0) {
    where.totalVotes = { gte: minVotesRequired };
  }

  // Determine sort order
  type OrderByType = Record<string, "asc" | "desc">;
  let orderBy: OrderByType = { validationScore: "desc" };
  switch (params.sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "votes":
      orderBy = { totalVotes: "desc" };
      break;
    case "trending":
      orderBy = { totalVotes: "desc" }; // NOTE: Simple proxy for trending; could be improved with growth velocity
      break;
    case "comments":
      orderBy = { totalComments: "desc" };
      break;
    default:
      orderBy = { validationScore: "desc" };
  }

  const ideas = await prisma.idea.findMany({
    where,
    include: {
      founder: {
        select: { id: true, name: true, username: true, image: true, bio: true, city: true },
      },
      _count: {
        select: { votes: true, comments: true, watchlistItems: true },
      },
    },
    orderBy,
    take: take + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = ideas.length > take;
  const items = hasMore ? ideas.slice(0, take) : ideas;

  return {
    success: true,
    data: {
      ideas: items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    },
  };
}

// ═══════════════════════════════
// WATCHLIST — Add/Update/Remove
// ═══════════════════════════════

export async function addToWatchlist(
  ideaId: string,
  status: WatchlistStatus = "WATCHING",
  notes?: string
): Promise<ActionResult> {
  const { profile } = await requireInvestor();

  // Validate input
  const parsed = watchlistSchema.safeParse({ ideaId, status, notes });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.watchlistItem.upsert({
    where: {
      investorId_ideaId: {
        investorId: profile.id,
        ideaId,
      },
    },
    create: {
      investorId: profile.id,
      ideaId,
      status,
      notes: notes ?? null,
    },
    update: {
      status,
      notes: notes ?? undefined,
    },
  });

  revalidatePath("/investor");
  revalidatePath("/investor/watchlist");
  return { success: true, data: undefined };
}

export async function removeFromWatchlist(
  ideaId: string
): Promise<ActionResult> {
  const { profile } = await requireInvestor();

  await prisma.watchlistItem.deleteMany({
    where: { investorId: profile.id, ideaId },
  });

  revalidatePath("/investor/watchlist");
  return { success: true, data: undefined };
}

export async function getMyWatchlist(): Promise<
  ActionResult<
    Array<{
      id: string;
      status: WatchlistStatus;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      idea: {
        id: string;
        slug: string;
        title: string;
        pitch: string;
        category: string;
        stage: string;
        totalVotes: number;
        validationScore: number;
        scoreTier: string;
        status: string;
        founder: { id: string; name: string; username: string | null; image: string | null };
      };
    }>
  >
> {
  const { profile } = await requireInvestor();

  const items = await prisma.watchlistItem.findMany({
    where: { investorId: profile.id },
    include: {
      idea: {
        include: {
          founder: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { success: true, data: items };
}

// ═══════════════════════════════
// EXPRESS INTEREST
// ═══════════════════════════════

export async function expressInterest(
  ideaId: string,
  message?: string
): Promise<ActionResult> {
  const { user, profile } = await requireInvestor();

  // Validate input
  const parsed = expressInterestSchema.safeParse({ ideaId, message });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { founder: { select: { id: true } } },
  });

  if (!idea || idea.status !== "ACTIVE") {
    return { success: false, error: "Idea not found or not active" };
  }

  // Cannot express interest in own idea
  if (idea.founderId === user.id) {
    return { success: false, error: "Cannot express interest in your own idea" };
  }

  // Check if already expressed interest
  const existing = await prisma.investorInterest.findUnique({
    where: {
      investorId_ideaId: {
        investorId: profile.id,
        ideaId,
      },
    },
  });

  if (existing) {
    return { success: false, error: "You have already expressed interest in this idea" };
  }

  await prisma.investorInterest.create({
    data: {
      investorId: profile.id,
      ideaId,
      message: message ?? null,
    },
  });

  // Notify founder (fire-and-forget)
  createNotificationInternal({
    userId: idea.founderId,
    type: "SYSTEM",
    title: "An investor is interested!",
    body: `An investor${profile.firmName ? ` from ${profile.firmName}` : ""} has expressed interest in your idea "${idea.title}".`,
    data: { link: `/dashboard/ideas/${idea.id}`, investorId: profile.id },
  }).catch(console.error);

  revalidatePath("/investor");
  return { success: true, data: undefined };
}

// ═══════════════════════════════
// RESPOND TO INTEREST (Founder)
// ═══════════════════════════════

export async function respondToInterest(
  interestId: string,
  response: "ACCEPTED" | "DECLINED"
): Promise<ActionResult> {
  const user = await requireUser();

  const interest = await prisma.investorInterest.findUnique({
    where: { id: interestId },
    include: {
      idea: { select: { founderId: true, title: true } },
      investor: {
        select: { userId: true, user: { select: { name: true } } },
      },
    },
  });

  if (!interest) {
    return { success: false, error: "Interest not found" };
  }

  // Only the idea founder can respond
  if (interest.idea.founderId !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  if (interest.status !== "PENDING") {
    return { success: false, error: "Already responded" };
  }

  await prisma.investorInterest.update({
    where: { id: interestId },
    data: { status: response as InterestStatus },
  });

  // Notify investor
  const statusMessage =
    response === "ACCEPTED"
      ? `The founder of "${interest.idea.title}" accepted your interest! You can now connect.`
      : `The founder of "${interest.idea.title}" has declined your interest at this time.`;

  // Notify investor (fire-and-forget)
  createNotificationInternal({
    userId: interest.investor.userId,
    type: "SYSTEM",
    title: response === "ACCEPTED" ? "Interest Accepted!" : "Interest Update",
    body: statusMessage,
  }).catch(console.error);

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ═══════════════════════════════
// INVESTOR DASHBOARD STATS
// ═══════════════════════════════

export async function getInvestorDashboardStats(): Promise<
  ActionResult<{
    watchlistCount: number;
    interestsExpressed: number;
    interestsAccepted: number;
    newIdeasThisWeek: number;
    watchlistAvgScore: number;
  }>
> {
  const { profile } = await requireInvestor();

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [watchlistItems, interestsExpressed, interestsAccepted, newIdeasThisWeek] =
    await Promise.all([
      prisma.watchlistItem.findMany({ 
        where: { investorId: profile.id },
        include: { idea: { select: { validationScore: true } } }
      }),
      prisma.investorInterest.count({ where: { investorId: profile.id } }),
      prisma.investorInterest.count({
        where: { investorId: profile.id, status: "ACCEPTED" },
      }),
      prisma.idea.count({
        where: {
          status: "ACTIVE",
          createdAt: { gte: startOfWeek },
          ...(profile.sectorInterests.length > 0
            ? { category: { in: profile.sectorInterests } }
            : {}),
        },
      }),
    ]);

  const watchlistCount = watchlistItems.length;
  const watchlistAvgScore =
    watchlistCount > 0
      ? Math.round(
          watchlistItems.reduce((sum, item) => sum + item.idea.validationScore, 0) / watchlistCount
        )
      : 0;

  return {
    success: true,
    data: {
      watchlistCount,
      interestsExpressed,
      interestsAccepted,
      newIdeasThisWeek,
      watchlistAvgScore,
    },
  };
}
