"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bookmark,
  Send,
  Loader2,
  Filter,
  ArrowUpRight,
  ChevronDown,
  Sparkles,
  BarChart3,
  Activity,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getInvestorDashboardStats,
  getInvestorDealFlow,
  addToWatchlist,
} from "@/actions/investor-actions";
import {
  CATEGORY_LABELS,
  STAGE_LABELS,
  SCORE_TIER_LABELS,
  SCORE_TIER_COLORS,
} from "@/lib/constants";
import type { Category, IdeaStage, ScoreTier } from "@prisma/client";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

type DealFlowIdea = {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  problem: string;
  solution: string;
  category: string;
  stage: string;
  status: string;
  totalVotes: number;
  totalViews: number;
  totalComments: number;
  validationScore: number;
  scoreTier: string;
  useThisCount: number;
  maybeCount: number;
  notForMeCount: number;
  createdAt: Date;
  founder: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    bio: string | null;
    city: string | null;
  };
  _count: { votes: number; comments: number; watchlistItems: number };
};

type DashboardStats = {
  watchlistCount: number;
  interestsExpressed: number;
  interestsAccepted: number;
  newIdeasThisWeek: number;
  watchlistAvgScore: number;
};

// Mock data for the momentum chart
const momentumData = [
  { name: "Mon", ideas: 12 },
  { name: "Tue", ideas: 19 },
  { name: "Wed", ideas: 15 },
  { name: "Thu", ideas: 26 },
  { name: "Fri", ideas: 22 },
  { name: "Sat", ideas: 30 },
  { name: "Sun", ideas: 42 },
];

export function InvestorDashboardClient() {
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ideas, setIdeas] = useState<DealFlowIdea[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [category, setCategory] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [sort, setSort] = useState<string>("score");
  const [minScore, setMinScore] = useState<string>("");

  const fetchDealFlow = useCallback(
    async (cursor?: string) => {
      const params: Record<string, string | number | undefined> = {
        sort: sort === "score" ? undefined : sort,
        category: category && category !== "all" ? category : undefined,
        stage: stage && stage !== "all" ? stage : undefined,
        minScore: minScore && minScore !== "none" ? Number(minScore) : undefined,
        cursor: cursor || undefined,
      };

      const result = await getInvestorDealFlow(params);
      if (result.success) {
        if (cursor) {
          setIdeas((prev) => [...prev, ...result.data.ideas]);
        } else {
          setIdeas(result.data.ideas);
        }
        setHasMore(result.data.hasMore);
        setNextCursor(result.data.nextCursor);
      }
    },
    [sort, category, stage, minScore]
  );

  // Load stats once
  useEffect(() => {
    getInvestorDashboardStats().then((statsResult) => {
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    });
  }, []);

  // Load/reload deal flow whenever filters change (also covers initial load)
  useEffect(() => {
    let mounted = true;
    
    setLoading(true);
    
    fetchDealFlow().then(() => {
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [fetchDealFlow]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    await fetchDealFlow(nextCursor);
    setLoadingMore(false);
  };

  const handleAddToWatchlist = (ideaId: string) => {
    startTransition(async () => {
      const result = await addToWatchlist(ideaId);
      if (result.success) {
        toast.success("Added to watchlist");
      } else {
        toast.error(result.error);
      }
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const topIdea = ideas.length > 0 ? ideas[0] : null;
  const feedIdeas = ideas.length > 0 ? ideas.slice(1) : [];

  return (
    <div className="space-y-8 pb-12">
      {/* ─── HERO & STATS ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-deep-ink p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-saffron/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-saffron backdrop-blur-md mb-4 border border-white/10">
                <Activity className="h-3 w-3" /> Alpha Deal Flow
              </div>
              <h1 className="font-display text-[32px] leading-tight md:text-[42px] tracking-tight">
                Investor Intelligence
              </h1>
              <p className="mt-2 text-[15px] text-white/60 max-w-xl leading-relaxed">
                Discover pre-vetted, high-signal startup ideas before they hit the mainstream. 
                Data-driven deal origination for modern investors.
              </p>
            </div>
            
            <div className="h-[120px] w-full md:w-[300px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={momentumData}>
                  <defs>
                    <linearGradient id="colorIdeas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f39c12" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f39c12" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1b26', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="ideas" stroke="#f39c12" strokeWidth={3} fillOpacity={1} fill="url(#colorIdeas)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-center text-[10px] uppercase tracking-wider text-white/40 font-bold mt-2">Platform Momentum (7d)</div>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 pt-6 border-t border-white/10 mt-6">
              <PremiumStatCard
                label="Your Watchlist"
                value={stats.watchlistCount}
                icon={Bookmark}
              />
              <PremiumStatCard
                label="Avg WL Score"
                value={stats.watchlistAvgScore}
                icon={BarChart3}
                suffix="%"
              />
              <PremiumStatCard
                label="Interests Sent"
                value={stats.interestsExpressed}
                icon={Send}
              />
              <PremiumStatCard
                label="New This Week"
                value={stats.newIdeasThisWeek}
                icon={Flame}
                highlight
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── HOT DEAL SPOTLIGHT ─────────────────────────────────────── */}
      {topIdea && sort === "score" && !category && !stage && !minScore && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Flame className="h-5 w-5 text-saffron" />
            <h2 className="font-display text-[22px] text-deep-ink">Highest Conviction Deal</h2>
          </div>
          <div className="rounded-2xl border-2 border-saffron/20 bg-gradient-to-br from-white to-warm-subtle p-1 shadow-xl">
            <DealFlowCard
              idea={topIdea}
              onWatchlist={() => handleAddToWatchlist(topIdea.id)}
              isPending={isPending}
              isSpotlight
            />
          </div>
        </div>
      )}

      {/* ─── DEAL FLOW TABLE / FEED ─────────────────────────────────── */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <h2 className="font-display text-[22px] text-deep-ink flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-blue" />
            Live Deal Flow
          </h2>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-[130px] border-warm-border text-[13px] bg-white rounded-xl shadow-sm">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
                  ([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-9 w-[130px] border-warm-border text-[13px] bg-white rounded-xl shadow-sm">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {(Object.entries(STAGE_LABELS) as [IdeaStage, string][]).map(
                  ([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger className="h-9 w-[110px] border-warm-border text-[13px] bg-white rounded-xl shadow-sm">
                <SelectValue placeholder="Min Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any Score</SelectItem>
                <SelectItem value="20">20+ Score</SelectItem>
                <SelectItem value="40">40+ Score</SelectItem>
                <SelectItem value="60">60+ Score</SelectItem>
                <SelectItem value="80">80+ Score</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[120px] border-warm-border text-[13px] bg-white rounded-xl shadow-sm font-medium">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Highest Score</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="votes">Most Votes</SelectItem>
                <SelectItem value="trending">Trending Now</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        {feedIdeas.length === 0 && (!topIdea || sort !== "score") ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-warm-border bg-white/50 py-20 text-center backdrop-blur-sm">
            <Filter className="mb-4 h-12 w-12 text-warm-border-strong" />
            <p className="font-display text-[20px] text-deep-ink">
              No deals match your criteria
            </p>
            <p className="mt-2 text-[14px] text-text-secondary">
              Try adjusting your filters or expanding your investment thesis.
            </p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={() => {
              setCategory(""); setStage(""); setMinScore(""); setSort("score");
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedIdeas.map((idea) => (
              <DealFlowCard
                key={idea.id}
                idea={idea}
                onWatchlist={() => handleAddToWatchlist(idea.id)}
                isPending={isPending}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-8">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-full bg-white px-8 border-warm-border shadow-sm text-deep-ink hover:text-saffron hover:border-saffron transition-all"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  Load More Deals
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Premium Stat Card ──────────────────────────────────

function PremiumStatCard({
  label,
  value,
  icon: Icon,
  highlight = false,
  suffix = "",
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  suffix?: string;
}) {
  return (
    <div className={cn(
      "rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden",
      highlight ? "bg-saffron text-white shadow-lg shadow-saffron/20" : "bg-white/5 border border-white/10 hover:bg-white/10"
    )}>
      {highlight && (
        <div className="absolute right-0 top-0 -mr-4 -mt-4 h-16 w-16 rounded-full bg-white/20 blur-xl" />
      )}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", highlight ? "text-white/80" : "text-white/50")} />
        <span className={cn("text-[11px] font-bold uppercase tracking-wider", highlight ? "text-white/90" : "text-white/60")}>
          {label}
        </span>
      </div>
      <p className="font-data text-[28px] font-bold leading-none tracking-tight">
        {value}{suffix}
      </p>
    </div>
  );
}

// ─── Deal Flow Card ──────────────────────────────

function DealFlowCard({
  idea,
  onWatchlist,
  isPending,
  isSpotlight = false,
}: {
  idea: DealFlowIdea;
  onWatchlist: () => void;
  isPending: boolean;
  isSpotlight?: boolean;
}) {
  const tier = idea.scoreTier as ScoreTier;
  const tierColor = SCORE_TIER_COLORS[tier] ?? "#94a3b8";
  const tierLabel = SCORE_TIER_LABELS[tier] ?? "Early Days";
  const categoryLabel = CATEGORY_LABELS[idea.category as Category] ?? idea.category;
  const stageLabel = STAGE_LABELS[idea.stage as IdeaStage] ?? idea.stage;

  const useThisPct =
    idea.totalVotes > 0
      ? Math.round((idea.useThisCount / idea.totalVotes) * 100)
      : 0;

  return (
    <div className={cn(
      "group flex flex-col md:flex-row items-stretch gap-6 rounded-xl bg-white p-5 transition-all duration-300",
      isSpotlight ? "border-0" : "border border-warm-border hover:border-warm-border-strong shadow-sm hover:shadow-card"
    )}>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Meta row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="border-warm-border bg-warm-subtle text-[11px] font-medium text-text-secondary px-2.5 py-0.5"
          >
            {categoryLabel}
          </Badge>
          <Badge
            variant="secondary"
            className="border-warm-border bg-warm-subtle text-[11px] font-medium text-text-secondary px-2.5 py-0.5"
          >
            {stageLabel}
          </Badge>
        </div>

        {/* Title + Pitch */}
        <Link
          href={`/idea/${idea.slug}`}
          className="inline-block"
        >
          <h3 className={cn(
            "font-bold text-deep-ink transition-colors group-hover:text-saffron leading-tight",
            isSpotlight ? "text-[24px]" : "text-[18px]"
          )}>
            {idea.title}
          </h3>
        </Link>
        <p className={cn(
          "mt-2 text-text-secondary leading-relaxed",
          isSpotlight ? "text-[15px] line-clamp-3" : "text-[14px] line-clamp-2"
        )}>
          {idea.pitch}
        </p>

        {/* Founder */}
        <div className="mt-4 flex items-center gap-3">
          <Link href={`/profile/${idea.founder.username ?? ""}`}>
            <div className={cn("overflow-hidden rounded-full border border-warm-border bg-warm-subtle hover:ring-2 hover:ring-saffron/30 transition-all", isSpotlight ? "h-8 w-8" : "h-6 w-6")}>
              {idea.founder.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={idea.founder.image}
                  alt={idea.founder.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-semibold text-text-muted text-[10px]">
                  {idea.founder.name.charAt(0)}
                </div>
              )}
            </div>
          </Link>
          <div className="flex flex-col">
            <Link href={`/profile/${idea.founder.username ?? ""}`} className="text-[13px] font-semibold text-deep-ink hover:underline">
              {idea.founder.name}
            </Link>
            {idea.founder.city && (
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                {idea.founder.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Score + Actions */}
      <div className={cn("flex md:w-[160px] md:shrink-0 flex-col items-center md:items-end justify-between md:justify-center gap-4 mt-4 md:mt-0 md:pl-6 md:border-l border-warm-border", isSpotlight && "md:w-[200px] md:pl-8")}>
        {/* Score ring */}
        <div className="flex items-center gap-4 md:flex-col md:gap-1 w-full justify-between md:justify-center">
          <div
            className={cn("flex shrink-0 items-center justify-center rounded-full border-[4px] bg-white shadow-inner", isSpotlight ? "h-16 w-16" : "h-14 w-14")}
            style={{ borderColor: tierColor }}
          >
            <span
              className={cn("font-data font-bold", isSpotlight ? "text-[28px]" : "text-[22px]")}
              style={{ color: tierColor }}
            >
              {idea.totalVotes >= 10 ? idea.validationScore : "--"}
            </span>
          </div>
          <div className="flex flex-col md:items-center">
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: tierColor }}
            >
              {idea.totalVotes >= 10 ? tierLabel : "Early"}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[12px] text-text-muted">
              <span className="font-data font-medium">{idea.totalVotes} votes</span>
              <span className="text-warm-border-strong">&bull;</span>
              <span className="font-data font-medium text-brand-green">{useThisPct}% yes</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-1 w-full gap-2 mt-3 md:mt-2">
          <Button
            variant="outline"
            onClick={onWatchlist}
            disabled={isPending}
            className={cn("w-full justify-center gap-2 rounded-xl border-warm-border-strong text-text-secondary hover:border-saffron hover:text-saffron hover:bg-saffron/5", isSpotlight ? "h-10 text-[14px]" : "h-9 text-[12px]")}
          >
            <Bookmark className={cn("shrink-0", isSpotlight ? "h-4 w-4" : "h-3.5 w-3.5")} />
            Watch
          </Button>
          <Button
            asChild
            className={cn("w-full justify-center gap-2 rounded-xl bg-deep-ink text-white hover:bg-deep-ink/90", isSpotlight ? "h-10 text-[14px]" : "h-9 text-[12px]")}
          >
            <Link href={`/idea/${idea.slug}`}>
              Review
              <ArrowUpRight className={cn("shrink-0", isSpotlight ? "h-4 w-4" : "h-3.5 w-3.5")} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12">
      <Skeleton className="h-[380px] w-full rounded-3xl" />
      <div className="flex justify-between">
        <Skeleton className="h-[40px] w-[200px] rounded-xl" />
        <Skeleton className="h-[40px] w-[400px] rounded-xl" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
      ))}
    </div>
  );
}
