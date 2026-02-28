import Link from "next/link";
import { RankMedal } from "@/components/leaderboard/rank-medal";
import { ScoreBadge } from "@/components/ideas/score-ring";
import { CATEGORY_EMOJIS, MIN_VOTES_FOR_SCORE } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { Category, ScoreTier } from "@prisma/client";

type LeaderboardIdea = {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  category: Category;
  validationScore: number;
  scoreTier: ScoreTier;
  totalVotes: number;
  useThisCount: number;
  founder: {
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

export function IdeaLeaderboardItem({
  idea,
  rank,
}: {
  idea: LeaderboardIdea;
  rank: number;
}) {
  return (
    <Link
      href={`/idea/${idea.slug}`}
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

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">
            {CATEGORY_EMOJIS[idea.category]}
          </span>
          <h3 className="truncate text-[15px] font-semibold text-deep-ink">
            {idea.title}
          </h3>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-text-muted">
          <span>by {idea.founder.name}</span>
          <span>&middot;</span>
          <span>{formatNumber(idea.totalVotes)} votes</span>
        </div>
      </div>

      {/* Score */}
      {idea.totalVotes >= MIN_VOTES_FOR_SCORE && (
        <ScoreBadge score={idea.validationScore} className="shrink-0" />
      )}
    </Link>
  );
}
