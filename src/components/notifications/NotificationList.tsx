import { NotificationDto } from "@/services/notifications.service";
import { NotificationItem, NotificationItemSkeleton } from "./NotificationItem";
import { EmptyState } from "@/components/EmptyState";
import { Bell } from "lucide-react";

interface NotificationListProps {
  notifications: NotificationDto[];
  loading: boolean;
  onMarkRead: (id: string) => void;
}

export function NotificationList({
  notifications,
  loading,
  onMarkRead,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <NotificationItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="You're all caught up! Notifications will appear here when events occur."
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}
