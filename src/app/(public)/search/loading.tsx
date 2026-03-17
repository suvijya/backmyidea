import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon } from "lucide-react";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header Skeleton */}
      <div className="text-center">
        <Skeleton className="mx-auto h-10 w-48 mb-2 rounded-lg" />
        <Skeleton className="mx-auto h-4 w-72 rounded-md" />
      </div>

      {/* Search Form Skeleton */}
      <div className="mt-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-300" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>

      {/* Results Skeleton */}
      <div className="mt-8 space-y-4">
        <Skeleton className="h-4 w-32 mb-2 rounded-md" />
        <Skeleton className="h-[120px] w-full rounded-2xl" />
        <Skeleton className="h-[120px] w-full rounded-2xl" />
        <Skeleton className="h-[120px] w-full rounded-2xl" />
      </div>
    </div>
  );
}