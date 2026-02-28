"use client";

import { getVotePercentages } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface VoteBreakdownProps {
  useThisCount: number;
  maybeCount: number;
  notForMeCount: number;
  className?: string;
}

export function VoteBreakdown({
  useThisCount,
  maybeCount,
  notForMeCount,
  className,
}: VoteBreakdownProps) {
  const total = useThisCount + maybeCount + notForMeCount;
  const pct = getVotePercentages(useThisCount, maybeCount, notForMeCount);

  if (total === 0) {
    return (
      <div className={cn("text-center text-[13px] text-text-muted", className)}>
        No votes yet. Be the first!
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <BreakdownBar
        label="I'd Use This"
        emoji="🔥"
        count={useThisCount}
        percentage={pct.useThis}
        color="bg-brand-green"
        bgColor="bg-brand-green-light"
      />
      <BreakdownBar
        label="Maybe"
        emoji="🤔"
        count={maybeCount}
        percentage={pct.maybe}
        color="bg-brand-amber"
        bgColor="bg-brand-amber-light"
      />
      <BreakdownBar
        label="Not For Me"
        emoji="👎"
        count={notForMeCount}
        percentage={pct.notForMe}
        color="bg-brand-red"
        bgColor="bg-brand-red-light"
      />
      <p className="text-center text-[12px] text-text-muted">
        {total} total {total === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}

function BreakdownBar({
  label,
  emoji,
  count,
  percentage,
  color,
  bgColor,
}: {
  label: string;
  emoji: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-deep-ink">
          <span>{emoji}</span>
          {label}
        </span>
        <span className="font-data text-[13px] text-text-secondary">
          {percentage}% ({count})
        </span>
      </div>
      <div className={cn("h-2 w-full overflow-hidden rounded-full", bgColor)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
