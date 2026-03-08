import { formatDistanceToNow } from "date-fns";
import { NotificationDto } from "@/services/notifications.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  ClipboardCheck,
  UserPlus,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; badge: string }
> = {
  success: {
    icon: <CheckCircle className="h-4 w-4 text-success" />,
    badge: "bg-success/10 text-success border-success/20",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
    badge: "bg-warning/10 text-warning border-warning/20",
  },
  error: {
    icon: <XCircle className="h-4 w-4 text-destructive" />,
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
  attendance: {
    icon: <ClipboardCheck className="h-4 w-4 text-primary" />,
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  enrollment: {
    icon: <UserPlus className="h-4 w-4 text-secondary" />,
    badge: "bg-secondary/10 text-secondary border-secondary/20",
  },
  session: {
    icon: <Calendar className="h-4 w-4 text-primary" />,
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  system: {
    icon: <Settings className="h-4 w-4 text-muted-foreground" />,
    badge: "bg-muted text-muted-foreground",
  },
  info: {
    icon: <Info className="h-4 w-4 text-primary" />,
    badge: "bg-primary/10 text-primary border-primary/20",
  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
}

interface NotificationItemProps {
  notification: NotificationDto;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const navigate = useNavigate();
  const cfg = getConfig(notification.type);

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
    if (notification.actionUrl) {
      setTimeout(() => navigate(notification.actionUrl!), 0);
    }
  };

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
      });
    } catch {
      return "";
    }
  })();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer group",
        notification.isRead
          ? "border-border bg-card hover:bg-muted/40"
          : "border-primary/20 bg-primary/5 hover:bg-primary/10",
      )}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-muted/60 group-hover:bg-muted transition-colors">
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-tight truncate",
              !notification.isRead && "text-foreground",
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={cn("text-xs", cfg.badge)}>{notification.type}</Badge>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs ml-auto text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              Mark read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border animate-pulse">
      <div className="shrink-0 h-8 w-8 rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
