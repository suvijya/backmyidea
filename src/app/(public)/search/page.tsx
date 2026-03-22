import { Suspense } from "react";
import { Search as SearchIcon } from "lucide-react";
import { getIdeasFeed } from "@/actions/idea-actions";
import { IdeaFeed } from "@/components/ideas/idea-feed";
import { IdeaFilters } from "@/components/ideas/idea-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { canUserViewGlobalScores } from "@/lib/clerk";
import { Skeleton } from "@/components/ui/skeleton";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Ideas | Piqd",
  description: "Search for startup ideas, founders, and concepts on Piqd. Find exactly what you're looking for.",
};

export const dynamic = "force-dynamic";
import type { IdeaFilters as IdeaFiltersType } from "@/types";
import type { Category, IdeaStage } from "@prisma/client";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    stage?: string;
    sort?: string;
  }>;
}

// ─── Search Results Loader ────────────────────────────────────────
async function SearchResults({ query, filters }: { query: string; filters: IdeaFiltersType }) {
  const [initialData, canViewScores] = await Promise.all([
    query ? getIdeasFeed(filters) : Promise.resolve({ items: [], hasMore: false }),
    canUserViewGlobalScores()
  ]);

  if (!query) {
    return (
      <div className="rounded-xl border border-dashed border-warm-border bg-warm-subtle/50 p-12 text-center">
        <SearchIcon className="mx-auto h-8 w-8 text-text-muted" />
        <h3 className="mt-3 text-[15px] font-semibold text-deep-ink">
          Start searching
        </h3>
        <p className="mt-1 text-[13px] text-text-secondary">
          Type a keyword above to find startup ideas
        </p>
      </div>
    );
  }

  if (initialData.items.length === 0) {
    return (
      <EmptyState
        icon={<SearchIcon className="h-5 w-5 text-text-muted" />}
        title="No results found"
        description={`We couldn't find any ideas matching "${query}". Try a different search term or adjust filters.`}
      />
    );
  }

  return (
    <>
      <p className="mb-4 text-[13px] text-text-muted">
        Showing results for &ldquo;{query}&rdquo;
      </p>
      <IdeaFeed initialIdeas={initialData.items} initialHasMore={initialData.hasMore} filters={filters} canViewGlobalScores={canViewScores} />
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";

  const filters: IdeaFiltersType = {
    search: query || undefined,
    category: params.category as Category | undefined,
    stage: params.stage as IdeaStage | undefined,
    sort: (params.sort as IdeaFiltersType["sort"]) ?? "trending",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-[32px] leading-tight text-deep-ink md:text-[40px]">
          Search Ideas
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Find startup ideas by keyword, category, or stage
        </p>
      </div>

      {/* Search Form */}
      <form action="/search" className="mt-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search for ideas, keywords, or tags..."
            className="w-full rounded-xl border border-warm-border bg-white py-3.5 pl-12 pr-4 text-[15px] text-deep-ink shadow-card transition-all placeholder:text-text-muted focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20"
            autoFocus
          />
        </div>
        {/* Pass other filters as hidden inputs */}
        {params.category && (
          <input type="hidden" name="category" value={params.category} />
        )}
        {params.stage && (
          <input type="hidden" name="stage" value={params.stage} />
        )}
        {params.sort && (
          <input type="hidden" name="sort" value={params.sort} />
        )}
      </form>

      {/* Filters */}
      <div className="mt-6">
        <IdeaFilters />
      </div>

      {/* Results */}
      <div className="mt-6">
        <Suspense key={JSON.stringify(filters)} fallback={
          <div className="space-y-4">
            <Skeleton className="h-4 w-32 mb-2 rounded-md" />
            <Skeleton className="h-[120px] w-full rounded-2xl" />
            <Skeleton className="h-[120px] w-full rounded-2xl" />
            <Skeleton className="h-[120px] w-full rounded-2xl" />
          </div>
        }>
          <SearchResults query={query} filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
