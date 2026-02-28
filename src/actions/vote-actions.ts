"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { voteLimiter } from "@/lib/redis";
import { castVoteSchema } from "@/lib/validations";
import { recalculateScore } from "./idea-actions";
import { createNotificationInternal } from "@/lib/notifications";
import { awardPoints, checkAndAwardBadges, updateUserLevel, updateStreak, checkEarlyBeliever } from "@/lib/gamification";
import { trackDailyStat } from "@/lib/daily-stats";
import { NEW_ACCOUNT_THRESHOLD_MS, NEW_ACCOUNT_VOTE_WEIGHT } from "@/lib/constants";
import type { ActionResult } from "@/types";
import type { Vote, VoteType } from "@prisma/client";
import { revalidatePath } from "next/cache";

// ═══════════════════════════════
// CAST / CHANGE VOTE
// ═══════════════════════════════

export async function castVote(
  formData: FormData
): Promise<ActionResult<Vote>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || !user.onboarded) {
    return { success: false, error: "Complete onboarding first" };
  }

  const raw = {
    ideaId: formData.get("ideaId") as string,
    type: formData.get("type") as string,
    reason: (formData.get("reason") as string) || undefined,
  };

  const parsed = castVoteSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  const { ideaId, type, reason } = parsed.data;

  // Check idea exists and is active
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { id: true, founderId: true, slug: true, title: true, status: true },
  });
  if (!idea || idea.status !== "ACTIVE") {
    return { success: false, error: "Idea not found or not active" };
  }

  // Cannot vote on own idea
  if (idea.founderId === user.id) {
    return { success: false, error: "You cannot vote on your own idea" };
  }

  // Rate limit (after ownership check to avoid spending tokens)
  const { success: withinLimit } = await voteLimiter.limit(user.id);
  if (!withinLimit) {
    return { success: false, error: "Too many votes. Try again later." };
  }

  // Calculate vote weight (new accounts get reduced weight)
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const weight = accountAge < NEW_ACCOUNT_THRESHOLD_MS ? NEW_ACCOUNT_VOTE_WEIGHT : 1.0;

  // Check for existing vote
  const existingVote = await prisma.vote.findUnique({
    where: { userId_ideaId: { userId: user.id, ideaId } },
  });

  if (existingVote) {
    // Changing vote type
    if (existingVote.type === type) {
      return { success: false, error: "You already voted with this option" };
    }

    const oldType = existingVote.type;

    // Atomic: update vote + adjust cached counts
    const [vote] = await prisma.$transaction([
      prisma.vote.update({
        where: { id: existingVote.id },
        data: { type: type as VoteType, reason: reason || null, weight },
      }),
      prisma.idea.update({
        where: { id: ideaId },
        data: {
          // Decrement old type count
          ...(oldType === "USE_THIS" && { useThisCount: { decrement: 1 } }),
          ...(oldType === "MAYBE" && { maybeCount: { decrement: 1 } }),
          ...(oldType === "NOT_FOR_ME" && { notForMeCount: { decrement: 1 } }),
          // Increment new type count
          ...(type === "USE_THIS" && { useThisCount: { increment: 1 } }),
          ...(type === "MAYBE" && { maybeCount: { increment: 1 } }),
          ...(type === "NOT_FOR_ME" && { notForMeCount: { increment: 1 } }),
        },
      }),
    ]);

    // Fire-and-forget
    recalculateScore(ideaId).catch(console.error);

    revalidatePath(`/idea/${idea.slug}`);
    return { success: true, data: vote };
  }

  // New vote — atomic: create vote + increment counts
  const [vote] = await prisma.$transaction([
    prisma.vote.create({
      data: {
        userId: user.id,
        ideaId,
        type: type as VoteType,
        reason: reason || null,
        weight,
      },
    }),
    prisma.idea.update({
      where: { id: ideaId },
      data: {
        totalVotes: { increment: 1 },
        ...(type === "USE_THIS" && { useThisCount: { increment: 1 } }),
        ...(type === "MAYBE" && { maybeCount: { increment: 1 } }),
        ...(type === "NOT_FOR_ME" && { notForMeCount: { increment: 1 } }),
      },
    }),
  ]);

  // Fire-and-forget: scoring, gamification, notifications, daily stats
  recalculateScore(ideaId).catch(console.error);
  awardPoints(user.id, "VOTE").catch(console.error);
  updateStreak(user.id).catch(console.error);
  checkAndAwardBadges(user.id).catch(console.error);
  updateUserLevel(user.id).catch(console.error);
  checkEarlyBeliever(user.id, ideaId).catch(console.error);
  trackDailyStat(ideaId, "votes").catch(console.error);

  // Notify the idea founder
  if (idea.founderId !== user.id) {
    createNotificationInternal({
      userId: idea.founderId,
      type: "NEW_VOTE",
      title: "New vote on your idea",
      body: `${user.name} voted "${type === "USE_THIS" ? "I'd Use This!" : type === "MAYBE" ? "Maybe" : "Not For Me"}" on "${idea.title}"`,
      data: { ideaId, ideaSlug: idea.slug, voteType: type, voterName: user.name },
    }).catch(console.error);
  }

  revalidatePath(`/idea/${idea.slug}`);
  return { success: true, data: vote };
}

// ═══════════════════════════════
// GET USER'S VOTES
// ═══════════════════════════════

export async function getUserVotes(userId: string) {
  const votes = await prisma.vote.findMany({
    where: { userId },
    include: {
      idea: {
        select: {
          id: true,
          slug: true,
          title: true,
          pitch: true,
          category: true,
          validationScore: true,
          scoreTier: true,
          totalVotes: true,
          founder: {
            select: { name: true, username: true, image: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return votes;
}
