"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExploreIdeaCard } from "@/components/explore/explore-idea-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { IdeaFeedItem } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeaturedIdeaCard } from "./featured-idea-card";

interface ExploreFeedProps {
  ideas: IdeaFeedItem[];
  totalPages: number;
  currentPage: number;
  canViewGlobalScores?: boolean;
}

export function ExploreFeed({ ideas, totalPages, currentPage, canViewGlobalScores = false }: ExploreFeedProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const featuredIdea = currentPage === 1 && ideas.length > 0 ? ideas[0] : null;
  const feedIdeas = currentPage === 1 && ideas.length > 0 ? ideas.slice(1) : ideas;

  if (ideas.length === 0) {
    return (
      <EmptyState
        title="No ideas found"
        description="Try adjusting your filters to discover more ideas."
        actionLabel="Clear Filters"
        actionHref="/explore"
      />
    );
  }

  // Generate pagination pages
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col h-full">
      {featuredIdea && (
        <FeaturedIdeaCard
          id={featuredIdea.id}
          slug={featuredIdea.slug}
          title={featuredIdea.title}
          pitch={featuredIdea.pitch}
          category={featuredIdea.category}
          validationScore={featuredIdea.validationScore}
          canViewScore={canViewGlobalScores || featuredIdea.founder.id === userId}
        />
      )}

      {/* Feed Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[28px] leading-tight text-deep-ink">
            Fresh Ideas
          </h2>
          <p className="text-[14px] text-text-secondary mt-1">
            Vote on the latest submissions from Indian founders.
          </p>
        </div>
        
        {/* Sort Dropdown */}
        <Select
          value={searchParams.get("sort") || "trending"}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "trending") params.delete("sort");
            else params.set("sort", value);
            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <SelectTrigger className="h-10 w-full md:h-9 md:w-[140px] rounded-lg border border-warm-border bg-white px-3 text-[14px] md:text-[13px] font-medium text-text-secondary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue shrink-0">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="newest">Most Recent</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="top">Top Rated</SelectItem>
            <SelectItem value="hot">Most Votes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {feedIdeas.map((idea) => {
          const userVote = idea.votes.find((v) => v.userId === userId)?.type ?? null;
          const isOwnIdea = idea.founder.id === userId;

          return (
            <ExploreIdeaCard
              key={idea.id}
              id={idea.id}
              slug={idea.slug}
              title={idea.title}
              pitch={idea.pitch}
              category={idea.category}
              stage={idea.stage}
              validationScore={idea.validationScore}
              scoreTier={idea.scoreTier}
              useThisCount={idea.useThisCount}
              maybeCount={idea.maybeCount}
              notForMeCount={idea.notForMeCount}
              founder={{
                name: idea.founder.name,
                username: idea.founder.username,
                imageUrl: idea.founder.image,
              }}
              createdAt={idea.createdAt}
              userVote={userVote}
              isOwnIdea={isOwnIdea}
              canViewScore={canViewGlobalScores || isOwnIdea}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 mb-8 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-border bg-white text-text-secondary transition-colors hover:border-warm-border-strong hover:bg-warm-subtle disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-1">
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-medium transition-colors",
                  currentPage === p
                    ? "bg-deep-ink text-white"
                    : "border border-warm-border bg-white text-text-secondary hover:border-warm-border-strong hover:bg-warm-subtle"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-border bg-white text-text-secondary transition-colors hover:border-warm-border-strong hover:bg-warm-subtle disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}