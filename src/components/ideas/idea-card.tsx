"use client";

import Link from "next/link";
import { MessageSquare, Eye, Share2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoteButtons } from "@/components/voting/vote-buttons";
import { ScoreBadge } from "@/components/ideas/score-ring";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  STAGE_LABELS,
  MIN_VOTES_FOR_SCORE,
} from "@/lib/constants";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { Category, IdeaStage, VoteType } from "@prisma/client";

interface IdeaCardProps {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  category: Category;
  stage: IdeaStage;
  validationScore: number;
  scoreTier: string;
  totalVotes: number;
  totalComments: number;
  totalViews: number;
  totalShares: number;
  useThisCount: number;
  maybeCount: number;
  notForMeCount: number;
  founder: {
    name: string;
    username: string | null;
    imageUrl: string | null;
    isVerified?: boolean;
  };
  createdAt: Date | string;
  userVote?: VoteType | null;
  isOwnIdea?: boolean;
  canViewScore?: boolean;
  className?: string;
}

export function IdeaCard({
  id,
  slug,
  title,
  pitch,
  category,
  stage,
  validationScore,
  scoreTier,
  totalVotes,
  totalComments,
  totalViews,
  totalShares,
  useThisCount,
  maybeCount,
  notForMeCount,
  founder,
  createdAt,
  userVote,
  isOwnIdea = false,
  canViewScore = false,
  className,
}: IdeaCardProps) {
  const showScore = totalVotes >= MIN_VOTES_FOR_SCORE && canViewScore;
  const timeStr = timeAgo(new Date(createdAt));

  return (
    <article
      className={cn(
        "group rounded-[10px] border border-warm-border bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-warm-border-strong hover:shadow-card-hover",
        className
      )}
    >
      {/* Header row: avatar + name + time + category */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${founder.username ?? ""}`}
            className="flex-shrink-0"
          >
            <div className="h-7 w-7 overflow-hidden rounded-full bg-warm-subtle">
              {founder.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={founder.imageUrl}
                  alt={founder.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-text-secondary">
                  {founder.name.charAt(0)}
                </div>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${founder.username ?? ""}`}
              className="text-[13px] font-medium text-deep-ink hover:underline"
            >
              {founder.name}
            </Link>
            {founder.isVerified && (
              <svg
                className="h-3.5 w-3.5 text-brand-green"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="text-[12px] text-text-muted">&middot;</span>
            <span className="text-[12px] text-text-muted">{timeStr}</span>
          </div>
        </div>
        <span className="rounded-full border border-warm-border bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
          {CATEGORY_EMOJIS[category]} {CATEGORY_LABELS[category]}
        </span>
      </div>

      {/* Title */}
      <Link href={`/idea/${slug}`}>
        <h3 className="mt-2.5 line-clamp-2 text-[17px] font-bold leading-snug text-deep-ink transition-colors group-hover:text-saffron">
          {title}
        </h3>
      </Link>

      {/* Pitch */}
      <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
        {pitch}
      </p>

      {/* Score + Stage row */}
      <div className="mt-3 flex items-center gap-2">
        {showScore && (
          <ScoreBadge score={validationScore} />
        )}
        <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
          {STAGE_LABELS[stage]}
        </span>
      </div>

      {/* Vote buttons */}
      <div className="mt-3">
        <VoteButtons
          ideaId={id}
          useThisCount={useThisCount}
          maybeCount={maybeCount}
          notForMeCount={notForMeCount}
          userVote={userVote}
          isOwnIdea={isOwnIdea}
        />
      </div>

      {/* Metadata row */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-text-muted">
          <span className="flex items-center gap-1 text-[12px]">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-data">{formatNumber(totalComments)}</span>
          </span>
          <span className="flex items-center gap-1 text-[12px]">
            <Eye className="h-3.5 w-3.5" />
            <span className="font-data">{formatNumber(totalViews)}</span>
          </span>
          <span className="flex items-center gap-1 text-[12px]">
            <Share2 className="h-3.5 w-3.5" />
            <span className="font-data">{formatNumber(totalShares)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-warm-hover hover:text-deep-ink"
            aria-label="Bookmark"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
