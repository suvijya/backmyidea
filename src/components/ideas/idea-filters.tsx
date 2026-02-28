"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  STAGE_LABELS,
} from "@/lib/constants";
import type { Category, IdeaStage } from "@prisma/client";
import type { SortOption } from "@/types";
import { cn } from "@/lib/utils";

interface IdeaFiltersProps {
  className?: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "top", label: "Top Rated" },
  { value: "hot", label: "Most Votes" },
];

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [Category, string][];
const STAGES = Object.entries(STAGE_LABELS) as [IdeaStage, string][];

export function IdeaFilters({ className }: IdeaFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = (searchParams.get("sort") as SortOption) || "trending";
  const currentCategory = searchParams.get("category") as Category | null;
  const currentStage = searchParams.get("stage") as IdeaStage | null;

  const hasFilters = currentCategory || currentStage;

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset cursor when filters change
      params.delete("cursor");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Sort tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam("sort", opt.value === "trending" ? null : opt.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              currentSort === opt.value
                ? "bg-saffron text-white"
                : "bg-warm-subtle text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={currentCategory ?? "all"}
          onValueChange={(v) => updateParam("category", v === "all" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[160px] border-warm-border bg-white text-[13px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {CATEGORY_EMOJIS[value]} {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentStage ?? "all"}
          onValueChange={(v) => updateParam("stage", v === "all" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[160px] border-warm-border bg-white text-[13px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 gap-1 text-[13px] text-text-muted hover:text-deep-ink"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
