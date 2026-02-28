import Link from "next/link";
import { Vote, Lightbulb } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankMedal } from "@/components/leaderboard/rank-medal";
import { LEVEL_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { UserLevel } from "@prisma/client";

type LeaderboardUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  points: number;
  level: UserLevel;
  _count: { votes: number; ideas: number };
};

export function UserLeaderboardItem({
  user,
  rank,
}: {
  user: LeaderboardUser;
  rank: number;
}) {
  return (
    <Link
      href={`/profile/${user.username ?? user.id}`}
      className="flex items-center gap-4 rounded-xl border border-warm-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      {/* Rank */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {rank <= 3 ? (
          <RankMedal rank={rank} />
        ) : (
          <span className="font-data text-[14px] font-bold text-text-muted">
            {rank}
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
            {LEVEL_LABELS[user.level]}
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
  );
}
