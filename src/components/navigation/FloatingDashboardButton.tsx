import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FloatingDashboardButtonProps {
  className?: string;
}

export function FloatingDashboardButton({
  className,
}: FloatingDashboardButtonProps) {
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label="Go to Dashboard"
            onClick={() => navigate("/")}
            className={cn(
              "fixed top-4 left-4 z-50",
              "w-10 h-10 rounded-xl",
              "bg-gradient-primary text-primary-foreground",
              "shadow-athletic-md hover:shadow-athletic-lg",
              "flex items-center justify-center",
              "transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              className,
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          Go to Dashboard
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
