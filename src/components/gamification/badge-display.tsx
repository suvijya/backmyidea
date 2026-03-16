"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Badge as BadgeType, UserBadge } from "@prisma/client";

interface BadgeDisplayProps {
  badges: (UserBadge & { badge: BadgeType })[];
  className?: string;
}

import { Award, Flame, Star, Zap, CheckCircle, MessageSquare, Lightbulb } from "lucide-react";

// NOTE: Badge icons are emoji-based since the seed data doesn't include icon URLs.
// If custom icons are added later, update this mapping.
const BADGE_ICONS: Record<string, React.ReactNode> = {
  "first-vote": <CheckCircle className="w-5 h-5 text-green-500" />,
  "validated-10": <Award className="w-5 h-5 text-blue-500" />,
  "validated-50": <Award className="w-5 h-5 text-indigo-500" />,
  "validated-100": <Award className="w-5 h-5 text-purple-600" />,
  "critic": <MessageSquare className="w-5 h-5 text-amber-500" />,
  "early-believer": <Star className="w-5 h-5 text-yellow-500" />,
  "streak-7": <Flame className="w-5 h-5 text-orange-500" />,
  "streak-30": <Flame className="w-5 h-5 text-red-500" />,
  "idea-maker": <Lightbulb className="w-5 h-5 text-yellow-400" />,
  "validated-founder": <CheckCircle className="w-5 h-5 text-emerald-500" />,
  "og": <Zap className="w-5 h-5 text-cyan-500" />,
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-amber/30 bg-brand-amber-light transition-all group-hover:border-brand-amber group-hover:shadow-md">
            {BADGE_ICONS[userBadge.badge.slug] ?? <Award className="w-5 h-5 text-brand-amber" />}
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
