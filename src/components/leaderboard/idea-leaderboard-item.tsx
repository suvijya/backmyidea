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
      className="flex items-center gap-3 sm:gap-4 rounded-xl border border-warm-border bg-white p-3 sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      {/* Rank */}
      <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center">
        {rank <= 3 ? (
          <RankMedal rank={rank} />
        ) : (
          <span className="font-data text-[13px] sm:text-[14px] font-bold text-text-muted">
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
          <h3 className="truncate text-[14px] sm:text-[15px] font-semibold text-deep-ink">
            {idea.title}
          </h3>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1 sm:gap-2 text-[11px] sm:text-[12px] text-text-muted">
          <span className="truncate max-w-[120px] sm:max-w-none">by {idea.founder.name}</span>
          <span className="hidden sm:inline">&middot;</span>
          <span className="font-data font-medium text-saffron">{formatNumber(idea.totalVotes)} votes</span>
        </div>
      </div>

      {/* Score */}
      {idea.totalVotes >= MIN_VOTES_FOR_SCORE ? (
        <ScoreBadge score={idea.validationScore} className="shrink-0 scale-90 sm:scale-100" />
      ) : (
        <div className="shrink-0 flex flex-col items-end">
          <span className="font-data text-[14px] sm:text-[16px] font-bold text-deep-ink">{idea.totalVotes}</span>
          <span className="text-[9px] uppercase tracking-wider text-text-muted">Votes</span>
        </div>
      )}
    </Link>
  );
}
