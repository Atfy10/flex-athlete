import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Variants ─────────────────────────────────────────────────────────────────

/**
 * Generic stat card skeleton — mirrors the 4-column stat grid used on
 * Dashboard, Sessions, Attendance, etc.
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("card-athletic", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Entity card skeleton — mirrors card-grid layouts used on Branches,
 * Sessions, TraineeGroups, Sports, etc.
 *
 * @param lines   Number of body-text lines to render (default 3)
 * @param footer  Show a footer button placeholder (default true)
 */
export function EntityCardSkeleton({
  lines = 3,
  footer = true,
  className,
}: {
  lines?: number;
  footer?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("card-athletic", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === 0 ? "w-full" : i === 1 ? "w-4/5" : "w-3/5"}`} />
        ))}
        {footer && (
          <div className="pt-3 border-t border-border">
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Session card skeleton — matches the SessionCard layout in Sessions.tsx
 * (sport title + badges top, 4 detail rows, dual action buttons).
 */
export function SessionCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("card-athletic flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <div className="pt-3 border-t border-border flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Attendance session-card skeleton — mirrors SessionAttendanceCard in
 * Attendance.tsx (title row + 4 counter boxes).
 */
export function AttendanceSessionSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("card-athletic", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-16 rounded-lg" />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-md" />
              <Skeleton className="h-7 w-14 rounded-md" />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

/**
 * Dashboard chart area skeleton — fills the 300 px chart container with
 * animated bars/columns appropriate for bar charts.
 */
export function ChartSkeleton({
  type = "bar",
  className,
}: {
  type?: "bar" | "line";
  className?: string;
}) {
  const heights = [60, 85, 50, 75, 40];
  return (
    <div className={cn("h-[300px] flex items-end gap-3 pb-4 px-2", className)}>
      {type === "line"
        ? heights.map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded" style={{ height: `${h}%` }} />
          ))
        : heights.map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
          ))}
    </div>
  );
}
