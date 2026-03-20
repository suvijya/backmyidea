"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bookmark,
  Trash2,
  Eye,
  ArrowUpRight,
  Loader2,
  StickyNote,
  ChevronDown,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getMyWatchlist,
  removeFromWatchlist,
  addToWatchlist,
  getMyInvestorStatus,
} from "@/actions/investor-actions";
import {
  WATCHLIST_STATUS_LABELS,
  CATEGORY_LABELS,
  SCORE_TIER_LABELS,
  SCORE_TIER_COLORS,
} from "@/lib/constants";
import type { WatchlistStatus, Category, ScoreTier } from "@prisma/client";

type WatchlistItemData = {
  id: string;
  status: WatchlistStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  idea: {
    id: string;
    slug: string;
    title: string;
    pitch: string;
    category: string;
    stage: string;
    totalVotes: number;
    validationScore: number;
    scoreTier: string;
    status: string;
    founder: {
      id: string;
      name: string;
      username: string | null;
      image: string | null;
    };
  };
};

const WATCHLIST_STATUS_OPTIONS = Object.entries(WATCHLIST_STATUS_LABELS) as [
  WatchlistStatus,
  string,
][];

export default function WatchlistPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<WatchlistItemData[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Check access
  useEffect(() => {
    getMyInvestorStatus().then((result) => {
      if (result.success && !result.data.hasProfile) {
        router.replace("/investor/apply");
      }
    });
  }, [router]);

  // Load watchlist
  useEffect(() => {
    setLoading(true);
    getMyWatchlist().then((result) => {
      if (result.success) {
        setItems(result.data);
      }
      setLoading(false);
    });
  }, []);

  const handleRemove = (ideaId: string) => {
    startTransition(async () => {
      const result = await removeFromWatchlist(ideaId);
      if (result.success) {
        setItems((prev) => prev.filter((item) => item.idea.id !== ideaId));
        toast.success("Removed from watchlist");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleStatusChange = (ideaId: string, newStatus: WatchlistStatus) => {
    startTransition(async () => {
      const result = await addToWatchlist(ideaId, newStatus);
      if (result.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.idea.id === ideaId ? { ...item, status: newStatus } : item
          )
        );
        toast.success(`Status updated to ${WATCHLIST_STATUS_LABELS[newStatus]}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const filteredItems =
    filterStatus === "all"
      ? items
      : items.filter((item) => item.status === filterStatus);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[24px] text-deep-ink">Watchlist</h1>
          <p className="text-[13px] text-text-secondary">
            Track ideas you&apos;re interested in
          </p>
        </div>

        {/* Filter by status */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-full border-warm-border text-[13px] sm:w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {WATCHLIST_STATUS_OPTIONS.map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {WATCHLIST_STATUS_OPTIONS.map(([status, label]) => {
          const count = items.filter((item) => item.status === status).length;
          if (count === 0) return null;
          return (
            <button
              key={status}
              onClick={() =>
                setFilterStatus(filterStatus === status ? "all" : status)
              }
              className={cn(
                "rounded-lg border px-3 py-1 text-[12px] font-medium transition-all",
                filterStatus === status
                  ? "border-saffron bg-saffron-light text-saffron"
                  : "border-warm-border text-text-secondary hover:border-warm-border-strong"
              )}
            >
              {label}{" "}
              <span className="font-data">{count}</span>
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-warm-border bg-white py-16 text-center">
          <Bookmark className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-[15px] font-medium text-deep-ink">
            {items.length === 0
              ? "Your watchlist is empty"
              : "No items match this filter"}
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            {items.length === 0
              ? "Browse the deal flow to add ideas to your watchlist"
              : "Try a different filter"}
          </p>
          {items.length === 0 && (
            <Button
              variant="outline"
              asChild
              className="mt-4 border-warm-border text-text-secondary"
            >
              <Link href="/investor">Browse Deal Flow</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <WatchlistCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item.idea.id)}
              onStatusChange={(status) =>
                handleStatusChange(item.idea.id, status)
              }
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistCard({
  item,
  onRemove,
  onStatusChange,
  isPending,
}: {
  item: WatchlistItemData;
  onRemove: () => void;
  onStatusChange: (status: WatchlistStatus) => void;
  isPending: boolean;
}) {
  const { idea } = item;
  const tier = idea.scoreTier as ScoreTier;
  const tierColor = SCORE_TIER_COLORS[tier] ?? "#94a3b8";
  const categoryLabel = CATEGORY_LABELS[idea.category as Category] ?? idea.category;

  return (
      <div className="rounded-xl border border-warm-border bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {/* Status + Category */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Select
              value={item.status}
              onValueChange={(val) => onStatusChange(val as WatchlistStatus)}
              disabled={isPending}
            >
              <SelectTrigger className="h-6 w-auto gap-1 border-warm-border px-2 text-[11px] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WATCHLIST_STATUS_OPTIONS.map(([val, label]) => (
                  <SelectItem key={val} value={val} className="text-[12px]">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge
              variant="secondary"
              className="border-warm-border bg-warm-subtle text-[11px] font-medium text-text-secondary"
            >
              {categoryLabel}
            </Badge>
          </div>

          {/* Title */}
          <Link href={`/idea/${idea.slug}`} className="group">
            <h3 className="text-[15px] font-semibold text-deep-ink transition-colors group-hover:text-saffron">
              {idea.title}
              <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </h3>
          </Link>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-text-secondary">
            {idea.pitch}
          </p>

          {/* Founder */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-4 w-4 overflow-hidden rounded-full border border-warm-border bg-warm-subtle">
              {idea.founder.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={idea.founder.image}
                  alt={idea.founder.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[8px] font-semibold text-text-muted">
                  {idea.founder.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-[12px] text-text-muted">
              {idea.founder.name}
            </span>
          </div>
        </div>

        {/* Score + Actions */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full border-[2.5px]"
            style={{ borderColor: tierColor }}
          >
            <span
              className="font-data text-[15px] font-bold"
              style={{ color: tierColor }}
            >
              {idea.totalVotes >= 10 ? idea.validationScore : "--"}
            </span>
          </div>
          <span className="font-data text-[11px] text-text-muted">
            {idea.totalVotes} votes
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 px-2 text-[11px] text-text-secondary hover:text-saffron"
            >
              <Link href={`/idea/${idea.slug}`}>
                <Eye className="mr-1 h-3 w-3" />
                View
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-text-muted hover:text-brand-red"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from watchlist?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove &quot;{idea.title}&quot; from your watchlist.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-warm-border">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onRemove}
                    className="bg-brand-red text-white hover:bg-brand-red/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
