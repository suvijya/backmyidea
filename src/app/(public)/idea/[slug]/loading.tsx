import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function IdeaDetailLoading() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
      {/* Back link */}
      <div className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* MAIN CONTENT SKELETON */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <Skeleton className="mt-4 h-12 w-3/4 rounded-lg" />
          
          <Skeleton className="mt-4 h-6 w-full rounded-md" />
          <Skeleton className="mt-2 h-6 w-11/12 rounded-md" />

          {/* Founder row */}
          <div className="mt-5 flex items-center gap-3 border-b border-warm-border pb-5">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
          </div>

          {/* Problem Section */}
          <section className="mt-6 space-y-3">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
          </section>

          {/* Solution Section */}
          <section className="mt-6 space-y-3">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </section>
        </div>

        {/* SIDEBAR SKELETON */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="space-y-5">
            {/* Score Card */}
            <div className="rounded-[16px] border border-warm-border bg-white p-6 shadow-card flex flex-col items-center">
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
              <Skeleton className="mt-4 h-3 w-32 rounded-md" />
              <div className="mt-5 w-full border-t border-warm-border pt-5">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="mt-2 h-2 w-full rounded-full" />
              </div>
            </div>

            {/* Vote Buttons */}
            <div className="rounded-[16px] border border-warm-border bg-white p-5 shadow-card">
              <Skeleton className="mx-auto h-4 w-40 rounded-md mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-[16px] border border-warm-border bg-white p-5 shadow-card">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <Skeleton className="h-6 w-12 rounded-md" />
                  <Skeleton className="h-3 w-10 rounded-md" />
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Skeleton className="h-6 w-12 rounded-md" />
                  <Skeleton className="h-3 w-10 rounded-md" />
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Skeleton className="h-6 w-12 rounded-md" />
                  <Skeleton className="h-3 w-10 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}