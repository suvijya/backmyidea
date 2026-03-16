"use client";

import Link from "next/link";
import { MessageSquare, Eye, Share2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoteButtons } from "@/components/voting/vote-buttons";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  STAGE_LABELS,
  MIN_VOTES_FOR_SCORE,
} from "@/lib/constants";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { Category, IdeaStage, VoteType } from "@prisma/client";

interface ExploreIdeaCardProps {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  category: Category;
  stage: IdeaStage;
  validationScore: number;
  scoreTier: string;
  totalVotes?: number;
  totalComments?: number;
  totalViews?: number;
  totalShares?: number;
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

export function ExploreIdeaCard({
  id,
  slug,
  title,
  pitch,
  category,
  stage,
  validationScore,
  scoreTier,
  useThisCount,
  maybeCount,
  notForMeCount,
  founder,
  createdAt,
  userVote,
  isOwnIdea = false,
  canViewScore = false,
  className,
}: ExploreIdeaCardProps) {
  const timeStr = timeAgo(new Date(createdAt));

  return (
    <article
      className={cn(
        "group relative flex flex-col sm:flex-row items-stretch gap-5 rounded-[10px] border border-warm-border bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-warm-border-strong hover:shadow-card-hover",
        className
      )}
    >
      {/* Additions: Bookmark icon top right of card */}
      <button
        className="absolute top-4 right-4 text-text-disabled hover:text-saffron transition-colors"
        aria-label="Bookmark"
      >
        <Bookmark className="h-4 w-4" />
      </button>

      {/* Additions: Score badge on the left */}
      {canViewScore && (
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-[80px] rounded-lg bg-warm-subtle/50 py-4 px-2 border border-warm-border">
          <span className="font-display text-[32px] leading-none text-deep-ink">
            {validationScore}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-1">
            Score
          </span>
        </div>
      )}

      {/* Middle: Original internal layout */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
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
          {/* Pushed left slightly to avoid overlapping the bookmark */}
          <span className="mr-8 rounded-full border border-warm-border bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
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

        {/* Stage row */}
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            {STAGE_LABELS[stage]}
          </span>
        </div>
      </div>

      {/* Additions: Voting buttons on the right */}
      <div className="shrink-0 flex items-center sm:pl-5 sm:border-l sm:border-warm-border pt-4 sm:pt-0 mt-4 sm:mt-0 border-t sm:border-t-0 border-warm-border">
        <VoteButtons
          ideaId={id}
          useThisCount={useThisCount}
          maybeCount={maybeCount}
          notForMeCount={notForMeCount}
          userVote={userVote}
          isOwnIdea={isOwnIdea}
          layout="vertical"
        />
      </div>
    </article>
  );
}
