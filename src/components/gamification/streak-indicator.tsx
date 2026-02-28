"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  className,
}: StreakIndicatorProps) {
  const isActive = currentStreak > 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5",
          isActive
            ? "bg-saffron-light text-saffron"
            : "bg-warm-subtle text-text-muted"
        )}
      >
        <Flame
          className={cn(
            "h-4 w-4",
            isActive && "animate-pulse text-saffron"
          )}
        />
        <span className="font-data text-[14px] font-bold">
          {currentStreak}
        </span>
        <span className="text-[12px] font-medium">
          day{currentStreak !== 1 ? "s" : ""}
        </span>
      </div>
      {longestStreak > 0 && (
        <span className="text-[11px] text-text-muted">
          Best: {longestStreak} day{longestStreak !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
