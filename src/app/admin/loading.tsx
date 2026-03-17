import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8 pb-12 w-full animate-in fade-in duration-500">
      {/* Hero section skeleton */}
      <Skeleton className="h-[250px] w-full rounded-3xl" />
      
      {/* Secondary metrics skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-[300px] w-full rounded-3xl lg:col-span-2" />
        <div className="flex flex-col justify-between space-y-4">
          <Skeleton className="h-[90px] w-full rounded-2xl" />
          <Skeleton className="h-[90px] w-full rounded-2xl" />
          <Skeleton className="h-[90px] w-full rounded-2xl" />
        </div>
      </div>
      
      {/* Control center skeleton */}
      <div className="space-y-4 mt-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-[100px] w-full rounded-2xl" />
          <Skeleton className="h-[100px] w-full rounded-2xl" />
          <Skeleton className="h-[100px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}