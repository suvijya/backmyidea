import { cn } from "@/lib/utils";

interface IdeaSkeletonProps {
  className?: string;
}

export function IdeaSkeleton({ className }: IdeaSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-warm-border bg-white p-5",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full skeleton-shimmer" />
          <div className="h-3.5 w-24 rounded skeleton-shimmer" />
          <div className="h-3 w-12 rounded skeleton-shimmer" />
        </div>
        <div className="h-5 w-20 rounded-full skeleton-shimmer" />
      </div>

      {/* Title */}
      <div className="mt-3 h-5 w-full rounded skeleton-shimmer" />
      <div className="mt-1.5 h-5 w-3/4 rounded skeleton-shimmer" />

      {/* Pitch */}
      <div className="mt-2 h-3.5 w-full rounded skeleton-shimmer" />

      {/* Score + Stage */}
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-14 rounded-md skeleton-shimmer" />
        <div className="h-5 w-20 rounded-full skeleton-shimmer" />
      </div>

      {/* Vote buttons */}
      <div className="mt-3 flex gap-2">
        <div className="h-10 flex-1 rounded-md skeleton-shimmer" />
        <div className="h-10 flex-1 rounded-md skeleton-shimmer" />
        <div className="h-10 flex-1 rounded-md skeleton-shimmer" />
      </div>

      {/* Meta row */}
      <div className="mt-3 flex gap-4">
        <div className="h-3.5 w-10 rounded skeleton-shimmer" />
        <div className="h-3.5 w-10 rounded skeleton-shimmer" />
        <div className="h-3.5 w-10 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

export function IdeaSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <IdeaSkeleton key={i} />
      ))}
    </div>
  );
}
