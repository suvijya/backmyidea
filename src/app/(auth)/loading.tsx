import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-[400px] space-y-6 px-4">
        <div className="text-center">
          <Skeleton className="mx-auto mb-4 h-10 w-32" />
          <Skeleton className="mx-auto h-5 w-48" />
        </div>
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    </div>
  );
}
