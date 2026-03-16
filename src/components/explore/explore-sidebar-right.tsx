import Link from "next/link";
import { Users, Lightbulb, TrendingUp, Trophy, ArrowUpRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserLevel } from "@prisma/client";
import { RealtimeTopValidator } from "./realtime-top-validator";

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
    <div className="space-y-4">
      {/* Community Pulse */}
      <div className="rounded-xl border border-warm-border bg-white p-4 shadow-card">
        <h3 className="font-display text-[18px] leading-tight text-deep-ink mb-3">
          Community Pulse
        </h3>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="font-data text-[16px] font-bold text-deep-ink leading-tight">
                {stats.activeVoters.toLocaleString()}+
              </p>
              <p className="text-[11px] font-medium text-text-muted">Active Voters</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron-light text-saffron">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <p className="font-data text-[16px] font-bold text-deep-ink leading-tight">
                {stats.ideasToday.toLocaleString()}
              </p>
              <p className="text-[11px] font-medium text-text-muted">Ideas Today</p>
            </div>
          </div>
        </div>

        <Link
          href="/leaderboard"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-warm-border-strong bg-warm-subtle py-1.5 text-[12px] font-semibold text-deep-ink transition-colors hover:bg-warm-hover"
        >
          View Analytics
        </Link>
      </div>

      {/* Trending in India */}
      <div className="rounded-xl border border-warm-border bg-white p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[18px] leading-tight text-deep-ink">
            Trending
          </h3>
          <TrendingUp className="h-3.5 w-3.5 text-brand-green" />
        </div>

        <div className="space-y-2 mb-3">
          {trendingTopics.map((topic, i) => (
            <Link 
              key={i} 
              href={`/explore?search=${encodeURIComponent(topic.name)}`}
              className="flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-[13px] font-semibold text-deep-ink group-hover:text-brand-blue transition-colors">
                  #{topic.name}
                </p>
              </div>
              <p className="text-[10px] text-text-muted flex items-center gap-1">
                {topic.count} ideas <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          ))}
        </div>

        <Link href="/explore" className="text-[11px] font-semibold text-saffron hover:text-saffron-dark flex items-center gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Top Validator */}
      {topValidator && (
        <RealtimeTopValidator initialData={topValidator} />
      )}
    </div>
  );
}