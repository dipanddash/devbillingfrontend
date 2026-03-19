import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardHeroSkeletonProps {
  className?: string;
  metricCount?: number;
}

interface DashboardKpiGridSkeletonProps {
  className?: string;
  cardCount?: number;
}

export function DashboardHeroSkeleton({
  className,
  metricCount = 4,
}: DashboardHeroSkeletonProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8",
        className,
      )}
    >
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 rounded-full bg-white/15" />
        <Skeleton className="h-10 w-3/4 bg-white/20" />
        <Skeleton className="h-5 w-1/2 bg-white/15" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: metricCount }).map((_, index) => (
          <div key={`hero-skeleton-metric-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-24 bg-white/15" />
            <Skeleton className="h-8 w-20 bg-white/20" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardKpiGridSkeleton({
  className,
  cardCount = 4,
}: DashboardKpiGridSkeletonProps) {
  return (
    <section className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: cardCount }).map((_, index) => (
        <div
          key={`kpi-skeleton-card-${index}`}
          className="rounded-lg border border-border bg-card p-3 shadow-soft"
        >
          <div className="mb-3 flex items-start justify-between">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-8 w-24" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </section>
  );
}

