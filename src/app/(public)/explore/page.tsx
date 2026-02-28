import { Suspense } from "react";
import { Search } from "lucide-react";
import { getIdeasFeed } from "@/actions/idea-actions";
import { IdeaFeed } from "@/components/ideas/idea-feed";
import { IdeaFilters } from "@/components/ideas/idea-filters";
import { IdeaSkeletonList } from "@/components/ideas/idea-skeleton";
import type { IdeaFilters as IdeaFiltersType, SortOption } from "@/types";
import type { Category, IdeaStage } from "@prisma/client";

export const dynamic = "force-dynamic";

interface ExplorePageProps {
  searchParams: Promise<{
    sort?: string;
    category?: string;
    stage?: string;
    search?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;

  const filters: IdeaFiltersType = {
    sort: (params.sort as SortOption) || "trending",
    category: params.category as Category | undefined,
    stage: params.stage as IdeaStage | undefined,
    search: params.search,
  };

  const { items, nextCursor, hasMore } = await getIdeasFeed(filters);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-[32px] leading-tight text-deep-ink">
          Explore Ideas
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Discover and validate startup ideas from founders across India
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <IdeaFilters className="mb-6" />
      </Suspense>

      {/* Feed */}
      <Suspense fallback={<IdeaSkeletonList count={6} />}>
        <IdeaFeed
          initialIdeas={items}
          initialCursor={nextCursor}
          initialHasMore={hasMore}
          filters={filters}
        />
      </Suspense>
    </div>
  );
}
