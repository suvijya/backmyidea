"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { IdeaCard } from "@/components/ideas/idea-card";
import { IdeaSkeletonList } from "@/components/ideas/idea-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getIdeasFeed } from "@/actions/idea-actions";
import type { IdeaFeedItem, IdeaFilters } from "@/types";

interface IdeaFeedProps {
  initialIdeas: IdeaFeedItem[];
  initialCursor?: string;
  initialHasMore: boolean;
  filters: IdeaFilters;
  canViewGlobalScores?: boolean;
}

export function IdeaFeed({
  initialIdeas,
  initialCursor,
  initialHasMore,
  filters,
  canViewGlobalScores = false,
}: IdeaFeedProps) {
  const { userId } = useAuth();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Reset when filters change (via new initialIdeas from server)
  useEffect(() => {
    setIdeas(initialIdeas);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
  }, [initialIdeas, initialCursor, initialHasMore]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return;
    setIsLoading(true);
    try {
      const result = await getIdeasFeed(filters, cursor);
      setIdeas((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      // Silently fail — user can scroll again
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, cursor, filters]);

  // We leave observerRef attached to the container so that scrolling triggers
  // loadMore automatically. The Load More button is a fallback for users
  // or if they want to click it before the observer triggers.
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (ideas.length === 0 && !isLoading) {
    return (
      <EmptyState
        title="No ideas found"
        description="Try adjusting your filters or check back later for new ideas."
        actionLabel="Clear Filters"
        actionHref="/explore"
      />
    );
  }

  return (
    <div>
      <div className="stagger-children space-y-4">
        {ideas.map((idea) => {
          const userVote = idea.votes.find((v) => v.userId === userId)?.type ?? null;
          const isOwnIdea = idea.founder.id === userId;

          return (
            <IdeaCard
              key={idea.id}
              id={idea.id}
              slug={idea.slug}
              title={idea.title}
              pitch={idea.pitch}
              category={idea.category}
              stage={idea.stage}
              validationScore={idea.validationScore}
              scoreTier={idea.scoreTier}
              totalVotes={idea.totalVotes}
              totalComments={idea.totalComments}
              totalViews={idea.totalViews}
              totalShares={idea.totalShares}
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

      {/* Infinite Scroll Observer & Load More Button */}
      {hasMore && (
        <div ref={observerRef} className="mt-8 flex justify-center pb-8">
          {isLoading ? (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Loading more ideas...</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="rounded-full bg-warm-subtle px-6 py-2.5 text-[14px] font-medium text-text-secondary transition-colors hover:bg-warm-hover hover:text-deep-ink"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
