"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LEVEL_LABELS, LEVEL_THRESHOLDS } from "@/lib/constants";
import type { UserLevel } from "@prisma/client";

interface LevelProgressProps {
  level: UserLevel;
  points: number;
  className?: string;
}

const LEVEL_COLORS: Record<UserLevel, string> = {
  NEWBIE: "bg-warm-border",
  EXPLORER_LEVEL: "bg-brand-blue",
  VALIDATOR: "bg-brand-green",
  TASTEMAKER: "bg-brand-amber",
  ORACLE: "bg-saffron",
};

export function LevelProgress({ level, points, className }: LevelProgressProps) {
  const [min, max] = LEVEL_THRESHOLDS[level];
  const levelLabel = LEVEL_LABELS[level];

  // Calculate progress within current level
  const effectiveMax = max === Infinity ? min + 5000 : max;
  const progress = Math.min(
    ((points - min) / (effectiveMax - min)) * 100,
    100
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-deep-ink">
            {levelLabel}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold text-white",
              LEVEL_COLORS[level]
            )}
          >
            Lv.{Object.keys(LEVEL_THRESHOLDS).indexOf(level) + 1}
          </span>
        </div>
        <span className="font-data text-[12px] font-medium text-text-muted">
          {points.toLocaleString()} pts
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-warm-subtle">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", LEVEL_COLORS[level])}
        />
      </div>

      {max !== Infinity && (
        <p className="text-[11px] text-text-muted">
          {effectiveMax - points} pts to next level
        </p>
      )}
    </div>
  );
}
