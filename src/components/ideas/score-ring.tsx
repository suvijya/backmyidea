"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  tier?: string;
  animate?: boolean;
}

function getScoreColor(score: number): string {
  if (score <= 40) return "#A8A29E"; // Weak signal — stone
  if (score <= 60) return "#F59E0B"; // Emerging — amber
  if (score <= 80) return "#F05A28"; // Strong — saffron
  return "#FF6A3C"; // High Momentum
}

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 8,
  className,
  showLabel = true,
  tier,
  animate = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const dashOffset = circumference - (normalizedScore / 100) * circumference;
  const color = getScoreColor(normalizedScore);

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F4F2F0"
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? undefined : dashOffset}
            style={
              animate
                ? {
                    ["--circumference" as string]: circumference,
                    ["--dash-offset" as string]: dashOffset,
                  }
                : undefined
            }
            className={animate ? "animate-score-ring" : undefined}
          />
        </svg>
        {/* Center score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-data font-bold leading-none text-deep-ink"
            style={{ fontSize: size * 0.3 }}
          >
            {normalizedScore}
          </span>
          <span
            className="font-data text-text-muted"
            style={{ fontSize: size * 0.12 }}
          >
            / 100
          </span>
        </div>
      </div>
      {showLabel && tier && (
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: `${color}15`,
            color: color,
            border: `1px solid ${color}30`,
          }}
        >
          {tier}
        </span>
      )}
    </div>
  );
}

/** Small inline score badge for cards and lists */
export function ScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const color = getScoreColor(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-data text-[12px] font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}12`,
        color: color,
        border: `1px solid ${color}25`,
      }}
    >
      {/* Mini ring */}
      <svg width="16" height="16" viewBox="0 0 16 16" className="-rotate-90">
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="#F4F2F0"
          strokeWidth="2"
        />
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 6}
          strokeDashoffset={
            2 * Math.PI * 6 - (Math.min(100, score) / 100) * 2 * Math.PI * 6
          }
        />
      </svg>
      {score}
    </span>
  );
}
