// NOTE: This file intentionally does NOT have "use server" — these are
// internal helpers called from server-side actions, not directly from clients.

import { prisma } from "@/lib/prisma";

type StatField = "views" | "votes" | "comments" | "shares";

/**
 * Upserts a daily stat row for the given idea, incrementing the specified field.
 * Uses the current UTC date as the partition key.
 * Always call fire-and-forget: `trackDailyStat(ideaId, "votes").catch(console.error)`
 */
export async function trackDailyStat(
  ideaId: string,
  field: StatField,
  amount: number = 1
): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.ideaDailyStat.upsert({
    where: { ideaId_date: { ideaId, date: today } },
    create: {
      ideaId,
      date: today,
      [field]: amount,
    },
    update: {
      [field]: { increment: amount },
    },
  });
}

/**
 * Snapshots the current validation score into today's daily stat row.
 * Called after recalculateScore so we can chart score progression over time.
 */
export async function snapshotDailyScore(
  ideaId: string,
  score: number
): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.ideaDailyStat.upsert({
    where: { ideaId_date: { ideaId, date: today } },
    create: {
      ideaId,
      date: today,
      score,
    },
    update: {
      score,
    },
  });
}

/**
 * Get daily stats for an idea over a date range.
 * Used by admin analytics and founder dashboards.
 */
export async function getIdeaDailyStats(
  ideaId: string,
  days: number = 30
): Promise<{
  date: Date;
  views: number;
  votes: number;
  comments: number;
  shares: number;
  score: number;
}[]> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days);

  return prisma.ideaDailyStat.findMany({
    where: {
      ideaId,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      views: true,
      votes: true,
      comments: true,
      shares: true,
      score: true,
    },
  });
}

/**
 * Get aggregated daily stats across ALL ideas for a date range.
 * Used by the admin analytics dashboard for platform-level charts.
 */
export async function getPlatformDailyStats(
  days: number = 30
): Promise<{
  date: string;
  views: number;
  votes: number;
  comments: number;
  shares: number;
}[]> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days);

  const stats = await prisma.ideaDailyStat.groupBy({
    by: ["date"],
    where: { date: { gte: since } },
    _sum: {
      views: true,
      votes: true,
      comments: true,
      shares: true,
    },
    orderBy: { date: "asc" },
  });

  return stats.map((row: any) => ({
    date: row.date.toISOString().split("T")[0],
    views: row._sum.views ?? 0,
    votes: row._sum.votes ?? 0,
    comments: row._sum.comments ?? 0,
    shares: row._sum.shares ?? 0,
  }));
}
