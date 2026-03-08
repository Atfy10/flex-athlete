import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  /** Lucide icon component to display at the top */
  icon?: LucideIcon;
  /** Bold heading */
  title: string;
  /** Supporting sentence below the heading */
  description?: string;
  /** Label for the primary CTA button (legacy single-action API) */
  actionLabel?: string;
  /** CTA click handler — button is only shown when this is provided */
  onAction?: () => void;
  /** Multiple action buttons — takes precedence over actionLabel/onAction */
  actions?: EmptyStateAction[];
  /** Additional class on the outer wrapper */
  className?: string;
}

/**
 * Reusable empty-state panel used across all list pages.
 *
 * Supports a single primary action (legacy) or an array of actions.
 *
 * Usage:
 *   <EmptyState
 *     icon={Users}
 *     title="No trainees yet"
 *     description="Add your first trainee to get started."
 *     actions={[
 *       { label: "Add Trainee", onClick: () => setOpen(true) },
 *       { label: "Import", onClick: () => {}, variant: "outline" },
 *     ]}
 *   />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actions,
  className,
}: EmptyStateProps) {
  // Normalise: if `actions` prop is provided, use that; else fall back to legacy API
  const resolvedActions: EmptyStateAction[] =
    actions && actions.length > 0
      ? actions
      : onAction && actionLabel
      ? [{ label: actionLabel, onClick: onAction }]
      : [];

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
        <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      )}
      {resolvedActions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {resolvedActions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={i}
                variant={action.variant ?? (i === 0 ? "default" : "outline")}
                onClick={action.onClick}
              >
                {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
