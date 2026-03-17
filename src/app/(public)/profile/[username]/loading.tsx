import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col items-center justify-center gap-6 rounded-[20px] bg-white p-8 shadow-card sm:flex-row sm:items-start sm:justify-start">
        <Skeleton className="h-28 w-28 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col items-center sm:items-start">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-4 w-64 mb-6" />
          
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Ideas List Skeleton */}
      <div className="mt-8 space-y-4">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-[120px] w-full rounded-[16px]" />
        <Skeleton className="h-[120px] w-full rounded-[16px]" />
        <Skeleton className="h-[120px] w-full rounded-[16px]" />
      </div>
    </div>
  );
}