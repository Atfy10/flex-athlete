import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  disabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  className?: string;
}

/**
 * Floating toolbar that appears at the bottom of the page when rows are selected.
 * Slides in from below when `selectedCount > 0`.
 */
export function BulkActionsBar({
  selectedCount,
  actions,
  onClear,
  className,
}: BulkActionsBarProps) {
  const visible = selectedCount > 0;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-8 opacity-0 pointer-events-none",
        className,
      )}
      aria-live="polite"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/95 backdrop-blur-sm px-4 py-2.5 shadow-xl shadow-black/10">
        {/* Selection count badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1.5">
            {selectedCount}
          </span>
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {selectedCount === 1 ? "item" : "items"} selected
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {actions.map((action, i) => (
            <Button
              key={i}
              size="sm"
              variant={action.variant ?? "outline"}
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-8 gap-1.5 text-xs"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Clear selection */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onClear}
          className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground"
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
