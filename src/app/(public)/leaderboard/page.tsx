import { prisma } from "@/lib/prisma";
import { LEADERBOARD_PAGE_SIZE } from "@/lib/constants";
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";
import { unstable_cache } from "next/cache";

// Cache leaderboard results for 5 minutes (300 seconds)
const getCachedLeaderboard = unstable_cache(
  async () => {
    const [topUsers, topIdeas] = await Promise.all([
      prisma.user.findMany({
        where: { onboarded: true, isBanned: false },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          points: true,
          level: true,
          currentStreak: true,
          _count: { select: { votes: true, ideas: true } },
        },
        orderBy: { points: "desc" },
        take: LEADERBOARD_PAGE_SIZE,
      }),
      prisma.idea.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          slug: true,
          title: true,
          pitch: true,
          category: true,
          validationScore: true,
          scoreTier: true,
          totalVotes: true,
          useThisCount: true,
          founder: {
            select: { name: true, username: true, image: true },
          },
        },
        orderBy: { validationScore: "desc" },
        take: LEADERBOARD_PAGE_SIZE,
      }),
    ]);
    return { topUsers, topIdeas };
  },
  ['global-leaderboard'],
  { revalidate: 300, tags: ['leaderboard'] }
);

export default async function LeaderboardPage() {
  const { topUsers, topIdeas } = await getCachedLeaderboard();

  return <LeaderboardClient topUsers={topUsers} topIdeas={topIdeas} />;
}
