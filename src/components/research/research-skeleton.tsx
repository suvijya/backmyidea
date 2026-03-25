import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export function ResearchSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Meta header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="space-y-4">
        {/* Accordion Item 1 */}
        <Card className="rounded-xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="p-6 pb-4 flex flex-row items-center gap-3 space-y-0">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 space-y-4 border-t">
            <div className="grid sm:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg mt-4" />
          </CardContent>
        </Card>

        {/* Accordion Item 2 */}
        <Card className="rounded-xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="p-6 flex flex-row items-center gap-3 space-y-0">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </CardHeader>
        </Card>

        {/* Accordion Item 3 */}
        <Card className="rounded-xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="p-6 flex flex-row items-center gap-3 space-y-0">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
