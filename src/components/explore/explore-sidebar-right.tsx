import Link from "next/link";
import { Users, Lightbulb, TrendingUp, Trophy, ArrowUpRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserLevel } from "@prisma/client";
import { LEVEL_LABELS } from "@/lib/constants";

interface ExploreSidebarRightProps {
  stats: {
    activeVoters: number;
    ideasToday: number;
  };
  trendingTopics: { name: string; count: number }[];
  topValidator: {
    name: string;
    username: string;
    image: string | null;
    level: UserLevel;
    reviewCount: number;
  } | null;
}

export function ExploreSidebarRight({ stats, trendingTopics, topValidator }: ExploreSidebarRightProps) {
  return (
    <div className="space-y-6">
      {/* Community Pulse */}
      <div className="rounded-2xl border border-warm-border bg-white p-5 shadow-card">
        <h3 className="font-display text-[20px] leading-tight text-deep-ink mb-4">
          Community Pulse
        </h3>
        
        <div className="space-y-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-data text-[18px] font-bold text-deep-ink leading-tight">
                {stats.activeVoters.toLocaleString()}+
              </p>
              <p className="text-[12px] font-medium text-text-muted">Active Voters</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-light text-saffron">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="font-data text-[18px] font-bold text-deep-ink leading-tight">
                {stats.ideasToday.toLocaleString()}
              </p>
              <p className="text-[12px] font-medium text-text-muted">Ideas Today</p>
            </div>
          </div>
        </div>

        <Link
          href="/leaderboard"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-warm-border-strong bg-warm-subtle py-2 text-[13px] font-semibold text-deep-ink transition-colors hover:bg-warm-hover"
        >
          View Analytics
        </Link>
      </div>

      {/* Trending in India */}
      <div className="rounded-2xl border border-warm-border bg-white p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[20px] leading-tight text-deep-ink">
            Trending in India
          </h3>
          <TrendingUp className="h-4 w-4 text-brand-green" />
        </div>

        <div className="space-y-3 mb-4">
          {trendingTopics.map((topic, i) => (
            <Link 
              key={i} 
              href={`/explore?search=${encodeURIComponent(topic.name)}`}
              className="flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-[14px] font-semibold text-deep-ink group-hover:text-brand-blue transition-colors">
                  #{topic.name}
                </p>
                <p className="text-[11px] text-text-muted">{topic.count} ideas</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-text-disabled group-hover:text-brand-blue transition-colors" />
            </Link>
          ))}
        </div>

        <Link href="/explore" className="text-[12px] font-semibold text-saffron hover:text-saffron-dark flex items-center gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Top Validator */}
      {topValidator && (
        <div className="relative overflow-hidden rounded-2xl bg-deep-ink p-5 text-white shadow-card">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-saffron/20 blur-2xl" />
          
          <div className="flex items-center gap-2 mb-3 text-saffron">
            <Trophy className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Validator</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-white/10 shrink-0">
              {topValidator.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={topValidator.image} alt={topValidator.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[14px] font-bold">
                  {topValidator.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-[14px] font-semibold leading-tight">{topValidator.name}</p>
              <p className="text-[11px] text-white/60">@{topValidator.username}</p>
            </div>
          </div>

          <p className="text-[13px] text-white/80 italic mb-4">
            &quot;I love finding the next big Indian unicorn early.&quot;
          </p>

          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-white/60">
              <strong className="text-white font-data">{topValidator.reviewCount}</strong> ideas validated
            </span>
            <span className="rounded-full bg-brand-green/20 px-2 py-0.5 font-semibold text-brand-green-light">
              {LEVEL_LABELS[topValidator.level]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}