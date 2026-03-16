"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Globe, Briefcase, Zap, Banknote } from "lucide-react";

// For the specific requested items: All Ideas, Trending, SaaS, Consumer, Fintech
const SIDEBAR_CATEGORIES = [
  { id: "all", label: "All Ideas", icon: Globe, value: null },
  { id: "trending", label: "Trending", icon: Sparkles, sort: "trending" },
  { id: "saas", label: "SaaS", icon: Zap, value: "SAAS" },
  { id: "consumer", label: "Consumer", icon: Briefcase, value: "D2C" },
  { id: "fintech", label: "Fintech", icon: Banknote, value: "FINTECH" },
];

const SIDEBAR_STAGES = [
  { id: "JUST_AN_IDEA", label: "Concept Stage", sublabel: "Just an idea" },
  { id: "PROTOTYPE", label: "MVP Ready", sublabel: "Prototype built" },
  { id: "LAUNCHED", label: "Early Traction", sublabel: "First users" },
];

export function ExploreSidebarLeft() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category");
  const currentStage = searchParams.get("stage");
  const currentSort = searchParams.get("sort");

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.delete("page"); // Reset page when filters change
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="sticky top-24 rounded-2xl border border-warm-border bg-white p-5 shadow-card">
      <h2 className="mb-4 text-[13px] font-bold tracking-wider text-text-muted uppercase">
        FILTERS / REFINE YOUR FEED
      </h2>

      {/* Categories */}
      <div className="mb-6 space-y-1">
        {SIDEBAR_CATEGORIES.map((item) => {
          const Icon = item.icon;
          let isActive = false;
          if (item.id === "all") isActive = !currentCategory && (!currentSort || currentSort === "newest");
          else if (item.sort) isActive = currentSort === item.sort && !currentCategory;
          else isActive = currentCategory === item.value;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "all") updateParams({ category: null, sort: "newest" });
                else if (item.sort) updateParams({ category: null, sort: item.sort });
                else updateParams({ category: item.value as string, sort: null });
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                isActive
                  ? "bg-warm-subtle text-deep-ink"
                  : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-saffron" : "text-text-muted")} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Stages */}
      <div>
        <h3 className="mb-3 px-1 text-[11px] font-bold tracking-wider text-text-disabled uppercase">
          Stage
        </h3>
        <div className="space-y-2">
          {SIDEBAR_STAGES.map((stage) => {
            const isActive = currentStage === stage.id;
            return (
              <label
                key={stage.id}
                className="group flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-warm-hover"
              >
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-warm-border-strong bg-white transition-colors group-hover:border-saffron">
                  {isActive && <div className="h-2 w-2 rounded-sm bg-saffron" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isActive}
                  onChange={() => updateParams({ stage: isActive ? null : stage.id })}
                />
                <div className="flex flex-col">
                  <span className={cn("text-[14px] font-medium leading-tight", isActive ? "text-deep-ink" : "text-text-secondary")}>
                    {stage.label}
                  </span>
                  <span className="text-[12px] text-text-disabled">
                    {stage.sublabel}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}