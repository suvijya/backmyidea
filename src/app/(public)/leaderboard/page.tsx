import { Trophy, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserLeaderboardItem } from "@/components/leaderboard/user-leaderboard-item";
import { IdeaLeaderboardItem } from "@/components/leaderboard/idea-leaderboard-item";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { LEADERBOARD_PAGE_SIZE } from "@/lib/constants";

export default async function LeaderboardPage() {
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-[32px] leading-tight text-deep-ink md:text-[40px]">
          Leaderboard
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Top validators and most promising ideas
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 bg-warm-subtle">
          <TabsTrigger value="users" className="gap-1.5 data-[state=active]:bg-white">
            <Trophy className="h-4 w-4" />
            Top Validators
          </TabsTrigger>
          <TabsTrigger value="ideas" className="gap-1.5 data-[state=active]:bg-white">
            <TrendingUp className="h-4 w-4" />
            Top Ideas
          </TabsTrigger>
        </TabsList>

        {/* Top Users */}
        <TabsContent value="users" className="mt-6">
          <div className="space-y-2">
            {topUsers.map((user, index) => (
              <UserLeaderboardItem
                key={user.id}
                user={user}
                rank={index + 1}
              />
            ))}

            {topUsers.length === 0 && (
              <div className="rounded-xl border border-dashed border-warm-border p-12 text-center">
                <Trophy className="mx-auto h-8 w-8 text-text-muted" />
                <p className="mt-3 text-[14px] text-text-secondary">
                  No users on the leaderboard yet. Be the first!
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Top Ideas */}
        <TabsContent value="ideas" className="mt-6">
          <div className="space-y-2">
            {topIdeas.map((idea, index) => (
              <IdeaLeaderboardItem
                key={idea.id}
                idea={idea}
                rank={index + 1}
              />
            ))}

            {topIdeas.length === 0 && (
              <div className="rounded-xl border border-dashed border-warm-border p-12 text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-text-muted" />
                <p className="mt-3 text-[14px] text-text-secondary">
                  No ideas yet. Submit the first one!
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
