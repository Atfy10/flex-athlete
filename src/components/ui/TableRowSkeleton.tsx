import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// ─── Column config ────────────────────────────────────────────────────────────
export interface ColumnSkeletonConfig {
  /** Tailwind width class, e.g. "w-32" or "w-1/4" */
  width: string;
  /** Number of stacked lines in this column (default 1) */
  lines?: number;
  /** Whether to show an avatar circle before the lines (default false) */
  avatar?: boolean;
}

// ─── Base table row skeleton ──────────────────────────────────────────────────
/**
 * Renders a single skeleton row that mimics a `<tr>` or card-row layout.
 * Pass `columns` to define each cell's width and line count.
 *
 * @example
 * <TableRowSkeleton columns={[
 *   { width: "w-1/4", lines: 2, avatar: true },
 *   { width: "w-1/4", lines: 2 },
 *   { width: "w-1/4", lines: 1 },
 *   { width: "w-1/4", lines: 1 },
 * ]} />
 */
export function TableRowSkeleton({
  columns,
  className,
}: {
  columns?: ColumnSkeletonConfig[];
  className?: string;
}) {
  const cols: ColumnSkeletonConfig[] = columns ?? [
    { width: "flex-1", lines: 2, avatar: true },
    { width: "flex-1", lines: 2 },
    { width: "flex-1", lines: 1 },
    { width: "w-32",   lines: 1 },
  ];

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-lg border border-border",
        className,
      )}
    >
      {cols.map((col, i) => (
        <div key={i} className={cn("flex items-center gap-3", col.width)}>
          {col.avatar && <Skeleton className="h-9 w-9 rounded-full shrink-0" />}
          <div className="flex-1 space-y-1.5">
            {Array.from({ length: col.lines ?? 1 }).map((_, j) => (
              <Skeleton
                key={j}
                className={cn("h-3.5 rounded", j === 0 ? "w-3/4" : "w-1/2")}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Card-based row skeleton (used by Enrollments, Coaches, Trainees) ─────────
/**
 * A card-wrapped row skeleton matching the Enrollment card layout:
 * avatar + name | program info | progress bar | status badges + action
 */
export function EnrollmentRowSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("card-athletic", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Trainee */}
          <div className="flex items-center gap-4 lg:w-1/4">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          {/* Program */}
          <div className="lg:w-1/4 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          {/* Progress */}
          <div className="lg:w-1/4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          {/* Status + action */}
          <div className="lg:w-1/4 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * A roster-row skeleton used inside the Attendance roster (expandable panel).
 * Renders `count` rows with avatar + name + check-in time + badge.
 */
export function RosterRowSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2 pt-4 border-t border-border", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * A simple list-item skeleton used in Dashboard's "Today's Sessions" list.
 */
export function SessionListItemSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg border border-border"
        >
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}
