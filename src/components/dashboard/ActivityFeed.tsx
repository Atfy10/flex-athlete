import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  UserPlus,
  Calendar,
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { NotificationDto } from "@/services/notifications.service";
import { formatRelativeDateTime, formatSmartDate } from "@/lib/dateUtils";

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; dot: string; label: string }
> = {
  attendance: {
    icon: <ClipboardCheck className="h-3.5 w-3.5" />,
    dot: "bg-primary",
    label: "Attendance",
  },
  enrollment: {
    icon: <UserPlus className="h-3.5 w-3.5" />,
    dot: "bg-secondary",
    label: "Enrollment",
  },
  session: {
    icon: <Calendar className="h-3.5 w-3.5" />,
    dot: "bg-primary",
    label: "Session",
  },
  trainee: {
    icon: <UserPlus className="h-3.5 w-3.5" />,
    dot: "bg-success",
    label: "Trainee",
  },
  success: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    dot: "bg-success",
    label: "Success",
  },
  warning: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    dot: "bg-warning",
    label: "Warning",
  },
  error: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    dot: "bg-destructive",
    label: "Error",
  },
  system: {
    icon: <Settings className="h-3.5 w-3.5" />,
    dot: "bg-muted-foreground",
    label: "System",
  },
  info: {
    icon: <Info className="h-3.5 w-3.5" />,
    dot: "bg-primary",
    label: "Info",
  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
}

function timeAgo(iso: string) {
  try {
    const { label, title } = formatSmartDate(iso);
    return { label, title };
  } catch {
    return { label: "", title: "" };
  }
}

// ─── Single activity row ──────────────────────────────────────────────────────
function ActivityRow({ item }: { item: NotificationDto }) {
  const navigate = useNavigate();
  const cfg = getConfig(item.type);
  const isClickable = !!item.actionUrl;

  const handleClick = () => {
    if (item.actionUrl) navigate(item.actionUrl);
  };

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => e.key === "Enter" && handleClick() : undefined}
      className={cn(
        "group flex items-start gap-3 py-3 border-b border-border last:border-0 transition-colors",
        isClickable && "cursor-pointer hover:bg-muted/40 rounded-lg px-2 -mx-2",
      )}
    >
      {/* Timeline dot + icon */}
      <div className="relative shrink-0 flex flex-col items-center pt-0.5">
        <div
          className={cn(
            "flex items-center justify-center h-7 w-7 rounded-full bg-muted/70 text-muted-foreground",
            item.type === "enrollment" && "text-secondary",
            item.type === "attendance" && "text-primary",
            item.type === "session"    && "text-primary",
            item.type === "trainee"    && "text-success",
            item.type === "success"    && "text-success",
            item.type === "warning"    && "text-warning",
            item.type === "error"      && "text-destructive",
          )}
        >
          {cfg.icon}
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {item.message}
        </p>
        <p
          className="text-xs text-muted-foreground/70 mt-1"
          title={timeAgo(item.createdAt).title}
        >
          {timeAgo(item.createdAt).label}
        </p>
      </div>

      {/* Arrow hint for clickable rows */}
      {isClickable && (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function ActivityRowSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Skeleton className="h-7 w-7 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
export interface ActivityFeedProps {
  items: NotificationDto[];
  loading?: boolean;
  /** Max number of entries to display */
  limit?: number;
}

export function ActivityFeed({ items, loading = false, limit = 10 }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivityRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <ClipboardCheck className="h-8 w-8 opacity-30" />
        <p className="text-sm">No recent activity today</p>
      </div>
    );
  }

  const sorted = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return (
    <div>
      {sorted.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </div>
  );
}
