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
    <div className="flex flex-col space-y-6 lg:space-y-8">
      {/* Categories */}
      <div>
        <h2 className="mb-3 px-1 lg:px-3 text-[11px] font-bold tracking-wider text-text-disabled uppercase">
          CATEGORIES
        </h2>
        <nav className="flex overflow-x-auto pb-2 scrollbar-none lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0">
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
                  "flex items-center gap-2 whitespace-nowrap rounded-full lg:rounded-lg px-4 lg:px-3 py-2 lg:py-2.5 text-[13px] lg:text-[14px] font-medium transition-colors mr-2 lg:mr-0 lg:w-full",
                  isActive
                    ? "bg-saffron text-white lg:bg-saffron-light lg:text-saffron"
                    : "border border-warm-border lg:border-transparent bg-white lg:bg-transparent text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
                )}
              >
                <Icon className={cn("h-[16px] w-[16px] lg:h-[18px] lg:w-[18px]", isActive ? "text-white lg:text-saffron" : "text-text-muted")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Stages */}
      <div>
        <h3 className="mb-3 px-1 lg:px-3 text-[11px] font-bold tracking-wider text-text-disabled uppercase">
          STAGE
        </h3>
        <nav className="flex overflow-x-auto pb-2 scrollbar-none lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0">
          {SIDEBAR_STAGES.map((stage) => {
            const isActive = currentStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => updateParams({ stage: isActive ? null : stage.id })}
                className={cn(
                  "flex items-center lg:items-start gap-2 lg:gap-3 rounded-full lg:rounded-lg px-4 lg:px-3 py-2 lg:py-2.5 text-left transition-colors mr-2 lg:mr-0 lg:w-full",
                  isActive
                    ? "bg-saffron lg:bg-saffron-light text-white lg:text-saffron border border-transparent"
                    : "bg-white lg:bg-transparent hover:bg-warm-hover border border-warm-border lg:border-transparent"
                )}
              >
                <div className={cn(
                  "hidden lg:flex mt-0.5 h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  isActive ? "border-saffron bg-saffron" : "border-warm-border-strong bg-white"
                )}>
                  {isActive && <div className="h-2 w-2 rounded-sm bg-white" />}
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-[13px] lg:text-[14px] font-medium leading-tight whitespace-nowrap", 
                    isActive ? "text-white lg:text-saffron" : "text-text-secondary"
                  )}>
                    {stage.label}
                  </span>
                  <span className={cn(
                    "hidden lg:block text-[12px] mt-0.5",
                    isActive ? "text-saffron/70" : "text-text-disabled"
                  )}>
                    {stage.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}