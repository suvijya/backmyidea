"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bookmark,
  Send,
  Eye,
  TrendingUp,
  Loader2,
  Lightbulb,
  Filter,
  ArrowUpRight,
  ChevronDown,
  Sparkles,
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
  getMyInvestorStatus,
  addToWatchlist,
} from "@/actions/investor-actions";
import {
  CATEGORY_LABELS,
  STAGE_LABELS,
  SCORE_TIER_LABELS,
  SCORE_TIER_COLORS,
} from "@/lib/constants";
import type { Category, IdeaStage, ScoreTier } from "@prisma/client";

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

export default function InvestorDashboardPage() {
  const router = useRouter();
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

  // Check access
  useEffect(() => {
    getMyInvestorStatus().then((result) => {
      if (result.success && !result.data.hasProfile) {
        router.replace("/investor/apply");
      }
    });
  }, [router]);

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
    setLoading(true);
    fetchDealFlow().then(() => {
      setLoading(false);
    });
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="Watchlist"
            value={stats.watchlistCount}
            icon={Bookmark}
          />
          <StatCard
            label="Avg WL Score"
            value={stats.watchlistAvgScore}
            icon={TrendingUp}
          />
          <StatCard
            label="Interests Sent"
            value={stats.interestsExpressed}
            icon={Send}
          />
          <StatCard
            label="Accepted"
            value={stats.interestsAccepted}
            icon={Sparkles}
          />
          <StatCard
            label="New This Week"
            value={stats.newIdeasThisWeek}
            icon={Lightbulb}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warm-border bg-white p-3">
        <Filter className="h-4 w-4 text-text-muted" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-[140px] border-warm-border text-[13px]">
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
              ([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="h-8 w-[140px] border-warm-border text-[13px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {(Object.entries(STAGE_LABELS) as [IdeaStage, string][]).map(
              ([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-8 w-[140px] border-warm-border text-[13px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Top Score</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="votes">Most Votes</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="comments">Most Discussed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={minScore} onValueChange={setMinScore}>
          <SelectTrigger className="h-8 w-[140px] border-warm-border text-[13px]">
            <SelectValue placeholder="Min Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Any Score</SelectItem>
            <SelectItem value="20">20+</SelectItem>
            <SelectItem value="40">40+</SelectItem>
            <SelectItem value="60">60+</SelectItem>
            <SelectItem value="80">80+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deal Flow List */}
      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-warm-border bg-white py-16 text-center">
          <Lightbulb className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-[15px] font-medium text-deep-ink">
            No ideas match your filters
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <DealFlowCard
              key={idea.id}
              idea={idea}
              onWatchlist={() => handleAddToWatchlist(idea.id)}
              isPending={isPending}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-1.5 border-warm-border text-text-secondary"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-warm-border bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-text-muted" />
        <span className="text-[12px] font-medium text-text-secondary">
          {label}
        </span>
      </div>
      <p className="mt-1 font-data text-[24px] font-semibold text-deep-ink">
        {value}
      </p>
    </div>
  );
}

// ─── Deal Flow Card ──────────────────────────────

function DealFlowCard({
  idea,
  onWatchlist,
  isPending,
}: {
  idea: DealFlowIdea;
  onWatchlist: () => void;
  isPending: boolean;
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
    <div className="rounded-xl border border-warm-border bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Meta row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="border-warm-border bg-warm-subtle text-[11px] font-medium text-text-secondary"
            >
              {categoryLabel}
            </Badge>
            <Badge
              variant="secondary"
              className="border-warm-border bg-warm-subtle text-[11px] font-medium text-text-secondary"
            >
              {stageLabel}
            </Badge>
          </div>

          {/* Title + Pitch */}
          <Link
            href={`/idea/${idea.slug}`}
            className="group"
          >
            <h3 className="text-[16px] font-semibold text-deep-ink transition-colors group-hover:text-saffron">
              {idea.title}
              <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </h3>
          </Link>
          <p className="mt-1 line-clamp-2 text-[13px] text-text-secondary">
            {idea.pitch}
          </p>

          {/* Founder */}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-5 w-5 overflow-hidden rounded-full border border-warm-border bg-warm-subtle">
              {idea.founder.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={idea.founder.image}
                  alt={idea.founder.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-text-muted">
                  {idea.founder.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-[12px] text-text-secondary">
              {idea.founder.name}
              {idea.founder.city && (
                <span className="text-text-muted"> / {idea.founder.city}</span>
              )}
            </span>
          </div>
        </div>

        {/* Score + Actions */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* Score ring */}
          <div className="flex flex-col items-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-[3px]"
              style={{ borderColor: tierColor }}
            >
              <span
                className="font-data text-[18px] font-bold"
                style={{ color: tierColor }}
              >
                {idea.totalVotes >= 10 ? idea.validationScore : "--"}
              </span>
            </div>
            <span
              className="mt-1 text-[10px] font-medium"
              style={{ color: tierColor }}
            >
              {idea.totalVotes >= 10 ? tierLabel : "Early"}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            <span className="font-data">{idea.totalVotes} votes</span>
            <span className="font-data">{useThisPct}% yes</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onWatchlist}
              disabled={isPending}
              className="h-7 gap-1 border-warm-border px-2 text-[11px] text-text-secondary hover:border-saffron hover:text-saffron"
            >
              <Bookmark className="h-3 w-3" />
              Watch
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 gap-1 border-warm-border px-2 text-[11px] text-text-secondary hover:border-saffron hover:text-saffron"
            >
              <Link href={`/idea/${idea.slug}`}>
                <Eye className="h-3 w-3" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[80px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[48px] rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[140px] rounded-xl" />
      ))}
    </div>
  );
}
