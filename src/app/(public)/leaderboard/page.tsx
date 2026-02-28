import Link from "next/link";
import { Trophy, Medal, Award, Vote, Lightbulb, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/ideas/score-ring";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  LEVEL_LABELS,
  LEADERBOARD_PAGE_SIZE,
  MIN_VOTES_FOR_SCORE,
} from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { Category, UserLevel } from "@prisma/client";

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
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-4 rounded-xl border border-warm-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {index < 3 ? (
                    <RankMedal rank={index + 1} />
                  ) : (
                    <span className="font-data text-[14px] font-bold text-text-muted">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback className="bg-saffron-light text-saffron text-sm font-bold">
                    {user.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-deep-ink">
                      {user.name}
                    </h3>
                    <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[10px] font-medium text-text-muted">
                      {LEVEL_LABELS[user.level as UserLevel]}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-muted">@{user.username}</p>
                </div>

                {/* Stats */}
                <div className="hidden items-center gap-4 text-[12px] text-text-muted sm:flex">
                  <span className="flex items-center gap-1">
                    <Vote className="h-3 w-3" />
                    {formatNumber(user._count.votes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    {formatNumber(user._count.ideas)}
                  </span>
                </div>

                {/* Points */}
                <div className="shrink-0 text-right">
                  <p className="font-data text-[16px] font-bold text-deep-ink">
                    {formatNumber(user.points)}
                  </p>
                  <p className="text-[10px] text-text-muted">pts</p>
                </div>
              </Link>
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
              <Link
                key={idea.id}
                href={`/idea/${idea.slug}`}
                className="flex items-center gap-4 rounded-xl border border-warm-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {index < 3 ? (
                    <RankMedal rank={index + 1} />
                  ) : (
                    <span className="font-data text-[14px] font-bold text-text-muted">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">
                      {CATEGORY_EMOJIS[idea.category as Category]}
                    </span>
                    <h3 className="truncate text-[15px] font-semibold text-deep-ink">
                      {idea.title}
                    </h3>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-text-muted">
                    <span>by {idea.founder.name}</span>
                    <span>·</span>
                    <span>{formatNumber(idea.totalVotes)} votes</span>
                  </div>
                </div>

                {/* Score */}
                {idea.totalVotes >= MIN_VOTES_FOR_SCORE && (
                  <ScoreBadge score={idea.validationScore} className="shrink-0" />
                )}
              </Link>
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

function RankMedal({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-brand-amber text-white",
    2: "bg-gray-400 text-white",
    3: "bg-amber-700 text-white",
  };

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full font-data text-[13px] font-bold ${colors[rank]}`}
    >
      {rank}
    </div>
  );
}
