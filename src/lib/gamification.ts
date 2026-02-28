// NOTE: This file intentionally does NOT have "use server" — these functions
// are internal helpers called only from other server-side code. Keeping them
// out of the server actions boundary prevents malicious clients from invoking
// them directly.

import { prisma } from "@/lib/prisma";
import {
  POINTS,
  LEVEL_THRESHOLDS,
  MIN_VOTES_FOR_STREAK,
} from "@/lib/constants";
import { createNotificationInternal } from "@/lib/notifications";
import type { UserLevel } from "@prisma/client";

// ═══════════════════════════════
// AWARD POINTS
// ═══════════════════════════════

type PointAction = keyof typeof POINTS;

export async function awardPoints(
  userId: string,
  action: PointAction
): Promise<void> {
  const pointsToAdd = POINTS[action];

  await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: pointsToAdd } },
  });
}

// ═══════════════════════════════
// UPDATE USER LEVEL
// ═══════════════════════════════

export async function updateUserLevel(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, level: true },
  });
  if (!user) return;

  const newLevel = calculateLevel(user.points);

  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });

    // Notify about level up
    createNotificationInternal({
      userId,
      type: "BADGE_EARNED",
      title: "Level Up!",
      body: `You've reached the ${newLevel.replace("_", " ")} level!`,
      data: { level: newLevel },
    }).catch(console.error);
  }
}

function calculateLevel(points: number): UserLevel {
  if (points > LEVEL_THRESHOLDS.ORACLE[0]) return "ORACLE";
  if (points > LEVEL_THRESHOLDS.TASTEMAKER[0]) return "TASTEMAKER";
  if (points > LEVEL_THRESHOLDS.VALIDATOR[0]) return "VALIDATOR";
  if (points > LEVEL_THRESHOLDS.EXPLORER_LEVEL[0]) return "EXPLORER_LEVEL";
  return "NEWBIE";
}

// ═══════════════════════════════
// UPDATE STREAK
// ═══════════════════════════════

export async function updateStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastVoteDate: true, currentStreak: true, longestStreak: true },
  });
  if (!user) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Count votes today
  const votesToday = await prisma.vote.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  });

  // Need MIN_VOTES_FOR_STREAK votes in a day to count as a streak day
  if (votesToday < MIN_VOTES_FOR_STREAK) return;

  const lastVoteDate = user.lastVoteDate;

  if (!lastVoteDate) {
    // First streak day
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastVoteDate: today,
        currentStreak: 1,
        longestStreak: Math.max(1, user.longestStreak),
      },
    });
    return;
  }

  const lastDate = new Date(lastVoteDate.getFullYear(), lastVoteDate.getMonth(), lastVoteDate.getDate());
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    // Same day — already counted
    return;
  }

  if (diffDays === 1) {
    // Consecutive day — extend streak
    const newStreak = user.currentStreak + 1;
    const newLongest = Math.max(newStreak, user.longestStreak);

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastVoteDate: today,
        currentStreak: newStreak,
        longestStreak: newLongest,
      },
    });

    // Award streak points
    awardPoints(userId, "DAILY_STREAK").catch(console.error);
  } else {
    // Streak broken — reset
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastVoteDate: today,
        currentStreak: 1,
      },
    });
  }
}

// ═══════════════════════════════
// CHECK AND AWARD BADGES
// ═══════════════════════════════

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: { select: { badge: { select: { slug: true } } } },
      _count: {
        select: {
          votes: true,
          ideas: true,
          comments: true,
        },
      },
    },
  });
  if (!user) return;

  const earnedSlugs = new Set(user.badges.map((b) => b.badge.slug));

  const badgesToAward: string[] = [];

  // Voting badges
  if (!earnedSlugs.has("first-vote") && user._count.votes >= 1) {
    badgesToAward.push("first-vote");
  }
  if (!earnedSlugs.has("validated-10") && user._count.votes >= 10) {
    badgesToAward.push("validated-10");
  }
  if (!earnedSlugs.has("validated-50") && user._count.votes >= 50) {
    badgesToAward.push("validated-50");
  }
  if (!earnedSlugs.has("validated-100") && user._count.votes >= 100) {
    badgesToAward.push("validated-100");
  }

  // Commenting badge
  if (!earnedSlugs.has("critic") && user._count.comments >= 25) {
    badgesToAward.push("critic");
  }

  // Founding badge
  if (!earnedSlugs.has("idea-maker") && user._count.ideas >= 1) {
    badgesToAward.push("idea-maker");
  }

  // Streak badges
  if (!earnedSlugs.has("streak-7") && user.currentStreak >= 7) {
    badgesToAward.push("streak-7");
  }
  if (!earnedSlugs.has("streak-30") && user.currentStreak >= 30) {
    badgesToAward.push("streak-30");
  }

  // Founder validation badge (has an idea with score > 60)
  if (!earnedSlugs.has("validated-founder")) {
    const highScoreIdea = await prisma.idea.findFirst({
      where: {
        founderId: userId,
        validationScore: { gte: 60 },
        status: "ACTIVE",
      },
    });
    if (highScoreIdea) {
      badgesToAward.push("validated-founder");
    }
  }

  if (badgesToAward.length === 0) return;

  // Fetch badge IDs
  const badges = await prisma.badge.findMany({
    where: { slug: { in: badgesToAward } },
    select: { id: true, slug: true, name: true },
  });

  // Award badges
  for (const badge of badges) {
    await prisma.userBadge
      .create({
        data: { userId, badgeId: badge.id },
      })
      .catch(() => {
        // Ignore duplicate errors (race condition protection)
      });

    // Notify
    createNotificationInternal({
      userId,
      type: "BADGE_EARNED",
      title: "Badge Earned!",
      body: `You earned the "${badge.name}" badge!`,
      data: { badgeSlug: badge.slug },
    }).catch(console.error);
  }
}

// ═══════════════════════════════
// CHECK EARLY BELIEVER (voted before idea hit 50 votes)
// ═══════════════════════════════

export async function checkEarlyBeliever(
  userId: string,
  ideaId: string
): Promise<void> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { totalVotes: true },
  });

  // Award if this was one of the first 10 votes
  if (idea && idea.totalVotes <= 10) {
    awardPoints(userId, "EARLY_BELIEVER").catch(console.error);
  }
}
