import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon component to display at the top */
  icon?: LucideIcon;
  /** Bold heading */
  title: string;
  /** Supporting sentence below the heading */
  description?: string;
  /** Label for the primary CTA button */
  actionLabel?: string;
  /** CTA click handler — button is only shown when this is provided */
  onAction?: () => void;
  /** Additional class on the outer wrapper */
  className?: string;
}

/**
 * Reusable empty-state panel used across all list pages.
 *
 * Usage:
 *   <EmptyState
 *     icon={Users}
 *     title="No coaches yet"
 *     description="Add your first coach to get started."
 *     actionLabel="Add Coach"
 *     onAction={() => setModalOpen(true)}
 *   />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {onAction && actionLabel && (
        <Button onClick={onAction} className="mt-5" variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
