import {
  MapPin,
  Building2,
  GraduationCap,
  Linkedin,
  Calendar,
  Lightbulb,
  Vote,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeDisplay } from "@/components/gamification/badge-display";
import { LevelProgress } from "@/components/gamification/level-progress";
import { StreakIndicator } from "@/components/gamification/streak-indicator";
import { StatPill } from "@/components/profile/stat-pill";
import { formatDate } from "@/lib/utils";
import type { UserProfile } from "@/types";

export function ProfileHeader({ user }: { user: UserProfile }) {
  return (
    <div className="rounded-2xl border border-warm-border bg-white p-6 shadow-card md:p-8">
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <Avatar className="h-20 w-20 shrink-0 md:h-24 md:w-24">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="bg-saffron-light text-saffron text-2xl font-bold">
            {user.name?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-[24px] leading-tight text-deep-ink md:text-[28px]">
                {user.name}
              </h1>
              <p className="text-[14px] text-text-muted">@{user.username}</p>
            </div>
            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-warm-border px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:border-brand-blue hover:text-brand-blue"
              >
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            )}
          </div>

          {user.bio && (
            <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
              {user.bio}
            </p>
          )}

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-text-muted">
            {(user.city || user.state) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[user.city, user.state].filter(Boolean).join(", ")}
              </span>
            )}
            {user.college && (
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {user.college}
              </span>
            )}
            {user.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {user.company}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {formatDate(user.createdAt)}
            </span>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-6">
            <StatPill icon={<Lightbulb className="h-3.5 w-3.5" />} value={user._count.ideas} label="Ideas" />
            <StatPill icon={<Vote className="h-3.5 w-3.5" />} value={user._count.votes} label="Votes" />
            <StatPill icon={<MessageSquare className="h-3.5 w-3.5" />} value={user._count.comments} label="Comments" />
          </div>
        </div>
      </div>

      {/* Gamification section */}
      <div className="mt-6 border-t border-warm-border pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <LevelProgress level={user.level} points={user.points} />
          <StreakIndicator
            currentStreak={user.currentStreak}
            longestStreak={user.longestStreak}
          />
        </div>
      </div>

      {/* Badges */}
      {user.badges.length > 0 && (
        <div className="mt-6 border-t border-warm-border pt-6">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
            Badges
          </h3>
          <BadgeDisplay badges={user.badges} className="mt-3" />
        </div>
      )}
    </div>
  );
}
