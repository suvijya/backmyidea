import { Suspense } from "react";
import { getExploreFeed } from "@/actions/idea-actions";
import { ExploreSidebarLeft } from "@/components/explore/explore-sidebar-left";
import { ExploreSidebarRight } from "@/components/explore/explore-sidebar-right";
import { ExploreFeed } from "@/components/explore/explore-feed";
import { IdeaSkeletonList } from "@/components/ideas/idea-skeleton";
import type { IdeaFilters as IdeaFiltersType, SortOption } from "@/types";
import type { Category, IdeaStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ExplorePageProps {
  searchParams: Promise<{
    sort?: string;
    category?: string;
    stage?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const filters: IdeaFiltersType = {
    sort: (params.sort as SortOption) || "trending",
    category: params.category as Category | undefined,
    stage: params.stage as IdeaStage | undefined,
    search: params.search,
  };

  // Fetch feed
  const { items, totalPages, currentPage } = await getExploreFeed(filters, page);

  // Fetch Right Sidebar Data
  const [activeVotersCount, ideasTodayCount, topValidatorRaw, recentIdeas] = await Promise.all([
    prisma.user.count({ where: { votes: { some: {} } } }),
    prisma.idea.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.user.findFirst({
      orderBy: { points: "desc" },
      where: { onboarded: true, isBanned: false },
      select: {
        name: true,
        username: true,
        image: true,
        level: true,
        _count: { select: { votes: true } },
      },
    }),
    prisma.idea.findMany({
      where: { status: "ACTIVE" },
      select: { tags: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const stats = {
    activeVoters: activeVotersCount,
    ideasToday: ideasTodayCount,
  };

  const tagCounts: Record<string, number> = {};
  recentIdeas.forEach((idea) => {
    // Also use categories as topics if tags are empty
    if (idea.tags && idea.tags.length > 0) {
      idea.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    } else {
      const cat = idea.category.toLowerCase().replace(/_/g, "-");
      tagCounts[cat] = (tagCounts[cat] || 0) + 1;
    }
  });

  let trendingTopics = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  if (trendingTopics.length === 0) {
    trendingTopics = [
      { name: "ai-agents", count: 24 },
      { name: "creator-economy", count: 18 },
      { name: "quick-commerce", count: 15 },
      { name: "b2b-saas", count: 12 },
    ];
  }

  const topValidator = topValidatorRaw
    ? {
        name: topValidatorRaw.name,
        username: topValidatorRaw.username || "",
        image: topValidatorRaw.image,
        level: topValidatorRaw.level,
        reviewCount: topValidatorRaw._count.votes,
      }
    : null;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr_260px]">
        {/* Left Sidebar */}
        <aside className="hidden lg:block">
          <ExploreSidebarLeft />
        </aside>

        {/* Center Main Content */}
        <main className="min-w-0">
          <Suspense fallback={<IdeaSkeletonList count={6} />}>
            <ExploreFeed ideas={items} totalPages={totalPages} currentPage={currentPage} />
          </Suspense>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block">
          <ExploreSidebarRight stats={stats} trendingTopics={trendingTopics} topValidator={topValidator} />
        </aside>
      </div>
    </div>
  );
}
