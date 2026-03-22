import { Suspense } from "react";
import { getExploreFeed } from "@/actions/idea-actions";
import { ExploreSidebarLeft } from "@/components/explore/explore-sidebar-left";
import { ExploreSidebarRight } from "@/components/explore/explore-sidebar-right";
import { ExploreFeed } from "@/components/explore/explore-feed";
import { IdeaSkeletonList } from "@/components/ideas/idea-skeleton";
import type { IdeaFilters as IdeaFiltersType, SortOption } from "@/types";
import type { Category, IdeaStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canUserViewGlobalScores } from "@/lib/clerk";
import { Skeleton } from "@/components/ui/skeleton";
import { redis } from "@/lib/redis";
import { unstable_cache } from "next/cache";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Startup Ideas | Piqd",
  description: "Browse, filter, and discover the latest startup ideas. Find out what's trending, vote on concepts, and see what people really want.",
};

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
async function getSidebarStats() {
  const CACHE_KEY = "explore:sidebar_stats";
  
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return cached as {
        activeVotersCount: number;
        ideasTodayCount: number;
        topValidatorRaw: any;
        recentIdeas: any[];
      };
    }
  } catch (err) {
    console.error("Redis error fetching sidebar stats:", err);
  }

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

  const stats = { activeVotersCount, ideasTodayCount, topValidatorRaw, recentIdeas };

  try {
    await redis.set(CACHE_KEY, stats, { ex: 300 }); // 5 minutes
  } catch (err) {
    console.error("Redis error saving sidebar stats:", err);
  }

  return stats;
}

// ─── Right Sidebar Loader ───────────────────────────────────────
async function RightSidebarLoader() {
  const { activeVotersCount, ideasTodayCount, topValidatorRaw, recentIdeas } = await getSidebarStats();

  const stats = {
    activeVoters: activeVotersCount,
    ideasToday: ideasTodayCount,
  };

  const tagCounts: Record<string, number> = {};
  recentIdeas.forEach((idea: { tags: string[]; category: string }) => {
    if (idea.tags && idea.tags.length > 0) {
      idea.tags.forEach((tag: string) => {
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

  return <ExploreSidebarRight stats={stats} trendingTopics={trendingTopics} topValidator={topValidator} />;
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
        <aside className="lg:sticky lg:top-24 min-w-0 overflow-hidden">
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