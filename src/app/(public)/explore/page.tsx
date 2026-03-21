import { Suspense } from "react";
import { getExploreFeed, getExploreSidebarData, getTrendingTopics } from "@/actions/idea-actions";
import { ExploreSidebarLeft } from "@/components/explore/explore-sidebar-left";
import { ExploreSidebarRight } from "@/components/explore/explore-sidebar-right";
import { ExploreFeed } from "@/components/explore/explore-feed";
import { IdeaSkeletonList } from "@/components/ideas/idea-skeleton";
import type { IdeaFilters as IdeaFiltersType, SortOption } from "@/types";
import type { Category, IdeaStage } from "@prisma/client";
import { canUserViewGlobalScores } from "@/lib/clerk";
import { Skeleton } from "@/components/ui/skeleton";
import { unstable_cache } from "next/cache";

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

// ─── Center Feed Loader ─────────────────────────────────────────
async function FeedLoader({ filters, page }: { filters: IdeaFiltersType; page: number }) {
  const [{ items, totalPages, currentPage }, canViewGlobalScores] = await Promise.all([
    getExploreFeed(filters, page),
    canUserViewGlobalScores(),
  ]);

  return <ExploreFeed ideas={items} totalPages={totalPages} currentPage={currentPage} canViewGlobalScores={canViewGlobalScores} />;
}

// Cache the expensive sidebar queries to revalidate only every 5 minutes (300 seconds)
const getCachedSidebarStats = unstable_cache(
  async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [activeVotersCount, ideasTodayCount, topValidatorRaw, recentIdeas] = await Promise.all([
      prisma.user.count({ where: { votes: { some: {} } } }),
      prisma.idea.count({
        where: {
          createdAt: { gte: today },
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

    return { activeVotersCount, ideasTodayCount, topValidatorRaw, recentIdeas };
  },
  ['explore-sidebar-stats'],
  { revalidate: 300, tags: ['sidebar-stats'] }
);

// ─── Right Sidebar Loader ───────────────────────────────────────
async function RightSidebarLoader() {
  const { activeVotersCount, ideasTodayCount, topValidatorRaw, recentIdeas } = await getCachedSidebarStats();

  const stats = {
    activeVoters: sidebarData.activeVoters,
    ideasToday: sidebarData.ideasToday,
  };

  const finalTrendingTopics = trendingTopics.length > 0 ? trendingTopics : [
    { name: "ai-agents", count: 24 },
    { name: "creator-economy", count: 18 },
    { name: "quick-commerce", count: 15 },
    { name: "b2b-saas", count: 12 },
  ];

  return (
    <ExploreSidebarRight
      stats={stats}
      trendingTopics={finalTrendingTopics}
      topValidator={sidebarData.topValidator}
    />
  );
}

// function SidebarSkeleton() {
//   return (
//     <div className="space-y-6">
//       <div className="rounded-2xl border border-warm-border p-5">
//         <Skeleton className="h-6 w-32 mb-4" />
//         <Skeleton className="h-4 w-full mb-2" />
//         <Skeleton className="h-4 w-2/3" />
//       </div>
//       <div className="rounded-2xl border border-warm-border p-5">
//         <Skeleton className="h-6 w-32 mb-4" />
//         <div className="flex gap-2">
//           <Skeleton className="h-8 w-16 rounded-full" />
//           <Skeleton className="h-8 w-20 rounded-full" />
//         </div>
//       </div>
//     </div>
//   );
// }

// ─── Main Page ──────────────────────────────────────────────────
export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const filters: IdeaFiltersType = {
    sort: (params.sort as SortOption) || "trending",
    category: params.category as Category | undefined,
    stage: params.stage as IdeaStage | undefined,
    search: params.search,
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr_260px] items-start">
        {/* Left Sidebar (Desktop) / Top Filters (Mobile) */}
        <aside className="lg:sticky lg:top-24">
          <ExploreSidebarLeft />
        </aside>

        {/* Center Main Content */}
        <main className="min-w-0">
          <Suspense key={JSON.stringify(filters) + page} fallback={<IdeaSkeletonList count={6} />}>
            <FeedLoader filters={filters} page={page} />
          </Suspense>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block sticky top-24">
          <Suspense fallback={<div className="space-y-4"><Skeleton className="h-[200px] rounded-2xl w-full" /><Skeleton className="h-[200px] rounded-2xl w-full" /></div>}>
            <RightSidebarLoader />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}