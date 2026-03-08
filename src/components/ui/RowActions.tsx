import { Eye, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowActionsProps {
  /** Route to navigate to on View click */
  viewHref: string;
  /** Secondary actions rendered inside the ⋯ dropdown */
  children?: React.ReactNode;
  /** Disable the view button */
  viewDisabled?: boolean;
}

/**
 * Reusable row-level action cell for table views.
 * Renders an 👁 icon button for one-click navigation + a ⋯ dropdown for secondary actions.
 *
 * Usage:
 * ```tsx
 * <TableCell onClick={(e) => e.stopPropagation()}>
 *   <RowActions viewHref={`/trainees/${trainee.id}`}>
 *     <DropdownMenuItem onClick={() => handleEdit(trainee)}>
 *       <Pencil className="h-4 w-4 mr-2" /> Edit
 *     </DropdownMenuItem>
 *   </RowActions>
 * </TableCell>
 * ```
 */
export function RowActions({ viewHref, children, viewDisabled }: RowActionsProps) {
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5">
        {/* ── View icon button ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              disabled={viewDisabled}
              onClick={() => navigate(viewHref)}
              aria-label="View profile"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">View profile</TooltipContent>
        </Tooltip>

        {/* ── Secondary actions ── */}
        {children && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">More actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {children}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  );
}
