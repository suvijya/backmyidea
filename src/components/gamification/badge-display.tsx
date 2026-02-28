"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Badge as BadgeType, UserBadge } from "@prisma/client";

interface BadgeDisplayProps {
  badges: (UserBadge & { badge: BadgeType })[];
  className?: string;
}

// NOTE: Badge icons are emoji-based since the seed data doesn't include icon URLs.
// If custom icons are added later, update this mapping.
const BADGE_ICONS: Record<string, string> = {
  "first-vote": "1",
  "validated-10": "10",
  "validated-50": "50",
  "validated-100": "100",
  "critic": "C",
  "early-believer": "EB",
  "streak-7": "7d",
  "streak-30": "30d",
  "idea-maker": "IM",
  "validated-founder": "VF",
  "og": "OG",
};

export function BadgeDisplay({ badges, className }: BadgeDisplayProps) {
  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((userBadge, index) => (
        <motion.div
          key={userBadge.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          title={`${userBadge.badge.name}: ${userBadge.badge.description}`}
          className="group relative"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-amber/30 bg-brand-amber-light text-[11px] font-bold text-brand-amber transition-all group-hover:border-brand-amber group-hover:shadow-md">
            {BADGE_ICONS[userBadge.badge.slug] ?? userBadge.badge.name.charAt(0)}
          </div>
          {/* Tooltip */}
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-deep-ink px-3 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {userBadge.badge.name}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-deep-ink" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
