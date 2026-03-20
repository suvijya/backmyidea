"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  GitCompareArrows,
  Plus,
  X,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getMyWatchlist,
  getMyInvestorStatus,
} from "@/actions/investor-actions";
import {
  CATEGORY_LABELS,
  STAGE_LABELS,
  SCORE_TIER_LABELS,
  SCORE_TIER_COLORS,
} from "@/lib/constants";
import type { Category, IdeaStage, ScoreTier } from "@prisma/client";

type CompareIdea = {
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

export default function ComparePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [watchlistIdeas, setWatchlistIdeas] = useState<CompareIdea[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  // Check access
  useEffect(() => {
    getMyInvestorStatus().then((result) => {
      if (result.success && !result.data.hasProfile) {
        router.replace("/investor/apply");
      }
    });
  }, [router]);

  // Load watchlist ideas for selection
  useEffect(() => {
    setLoading(true);
    getMyWatchlist().then((result) => {
      if (result.success) {
        setWatchlistIdeas(result.data.map((item) => item.idea));
      }
      setLoading(false);
    });
  }, []);

  const selectedIdeas = watchlistIdeas.filter((idea) =>
    selectedIds.includes(idea.id)
  );

  const addIdea = (ideaId: string) => {
    if (selectedIds.length >= 4) {
      toast.error("You can compare up to 4 ideas at a time");
      return;
    }
    if (!selectedIds.includes(ideaId)) {
      setSelectedIds((prev) => [...prev, ideaId]);
    }
    setShowPicker(false);
  };

  const removeIdea = (ideaId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== ideaId));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
      <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] text-deep-ink">
          Compare Ideas
        </h1>
        <p className="text-[13px] text-text-secondary">
          Side-by-side comparison of up to 4 ideas from your watchlist
        </p>
      </div>

      {watchlistIdeas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-warm-border bg-white py-16 text-center">
          <GitCompareArrows className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-[15px] font-medium text-deep-ink">
            No ideas in your watchlist
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            Add ideas to your watchlist first, then compare them here
          </p>
          <Button
            variant="outline"
            asChild
            className="mt-4 border-warm-border text-text-secondary"
          >
            <Link href="/investor">Browse Deal Flow</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Idea Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="flex max-w-full items-center gap-1.5 rounded-lg border border-saffron bg-saffron-light px-3 py-1.5"
              >
                <span className="truncate text-[13px] font-medium text-saffron">
                  {idea.title}
                </span>
                <button
                  onClick={() => removeIdea(idea.id)}
                  className="rounded-full p-0.5 text-saffron/70 transition-colors hover:text-saffron"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {selectedIds.length < 4 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPicker(!showPicker)}
                  className="h-8 gap-1 border-dashed border-warm-border text-[12px] text-text-secondary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Idea ({selectedIds.length}/4)
                </Button>

                {/* Dropdown picker */}
                {showPicker && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-warm-border bg-white p-2 shadow-lg sm:w-80 sm:right-auto">
                    {watchlistIdeas
                      .filter((idea) => !selectedIds.includes(idea.id))
                      .map((idea) => (
                        <button
                          key={idea.id}
                          onClick={() => addIdea(idea.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-warm-hover"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-deep-ink">
                              {idea.title}
                            </p>
                            <p className="truncate text-[11px] text-text-muted">
                              {CATEGORY_LABELS[idea.category as Category] ??
                                idea.category}
                            </p>
                          </div>
                          <span className="font-data text-[12px] font-semibold text-text-secondary">
                            {idea.totalVotes >= 10
                              ? idea.validationScore
                              : "--"}
                          </span>
                        </button>
                      ))}
                    {watchlistIdeas.filter(
                      (idea) => !selectedIds.includes(idea.id)
                    ).length === 0 && (
                      <p className="px-3 py-2 text-[12px] text-text-muted">
                        All watchlist ideas are already selected
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comparison Table */}
          {selectedIdeas.length >= 2 ? (
            <div className="overflow-x-auto rounded-xl border border-warm-border bg-white overscroll-x-contain">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-warm-border">
                    <th className="sticky left-0 bg-warm-subtle px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-text-muted">
                      Metric
                    </th>
                    {selectedIdeas.map((idea) => (
                      <th
                        key={idea.id}
                        className="min-w-[180px] px-4 py-3 text-left"
                      >
                        <Link
                          href={`/idea/${idea.slug}`}
                          className="group text-[13px] font-semibold text-deep-ink hover:text-saffron"
                        >
                          {idea.title}
                          <ArrowUpRight className="ml-0.5 inline h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="Category">
                    {selectedIdeas.map((idea) => (
                      <td key={idea.id} className="px-4 py-2.5">
                        <Badge
                          variant="secondary"
                          className="border-warm-border bg-warm-subtle text-[11px]"
                        >
                          {CATEGORY_LABELS[idea.category as Category] ??
                            idea.category}
                        </Badge>
                      </td>
                    ))}
                  </CompareRow>
                  <CompareRow label="Stage">
                    {selectedIdeas.map((idea) => (
                      <td
                        key={idea.id}
                        className="px-4 py-2.5 text-[13px] text-deep-ink"
                      >
                        {STAGE_LABELS[idea.stage as IdeaStage] ?? idea.stage}
                      </td>
                    ))}
                  </CompareRow>
                  <CompareRow label="Score">
                    {selectedIdeas.map((idea) => {
                      const tier = idea.scoreTier as ScoreTier;
                      const color =
                        SCORE_TIER_COLORS[tier] ?? "#94a3b8";
                      return (
                        <td key={idea.id} className="px-4 py-2.5">
                          <span
                            className="font-data text-[18px] font-bold"
                            style={{ color }}
                          >
                            {idea.totalVotes >= 10
                              ? idea.validationScore
                              : "--"}
                          </span>
                          <span
                            className="ml-2 text-[11px] font-medium"
                            style={{ color }}
                          >
                            {idea.totalVotes >= 10
                              ? SCORE_TIER_LABELS[tier] ?? ""
                              : "Early"}
                          </span>
                        </td>
                      );
                    })}
                  </CompareRow>
                  <CompareRow label="Total Votes">
                    {selectedIdeas.map((idea) => (
                      <td
                        key={idea.id}
                        className="px-4 py-2.5 font-data text-[14px] font-semibold text-deep-ink"
                      >
                        {idea.totalVotes}
                      </td>
                    ))}
                  </CompareRow>
                  <CompareRow label="Founder">
                    {selectedIdeas.map((idea) => (
                      <td
                        key={idea.id}
                        className="px-4 py-2.5 text-[13px] text-text-secondary"
                      >
                        {idea.founder.name}
                      </td>
                    ))}
                  </CompareRow>
                  <CompareRow label="Pitch">
                    {selectedIdeas.map((idea) => (
                      <td
                        key={idea.id}
                        className="px-4 py-2.5 text-[12px] leading-relaxed text-text-secondary"
                      >
                        {idea.pitch}
                      </td>
                    ))}
                  </CompareRow>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-warm-border bg-warm-subtle/50 py-16 text-center">
              <GitCompareArrows className="mb-3 h-8 w-8 text-text-muted" />
              <p className="text-[14px] font-medium text-text-secondary">
                Select at least 2 ideas to compare
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                Use the &quot;Add Idea&quot; button above to pick from your watchlist
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-warm-border last:border-0">
      <td className="sticky left-0 bg-warm-subtle/50 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </td>
      {children}
    </tr>
  );
}
