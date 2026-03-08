import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useToast } from "@/hooks/use-toast";
import { useSignalREvent } from "@/realtime/useSignalREvent";
import { REALTIME_EVENTS, NotificationPayload } from "@/realtime/realtimeEvents";
import {
  NotificationDto,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notifications.service";
import { useRealtime } from "@/contexts/RealtimeContext";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { toast } = useToast();
  const { decrementUnread, resetUnread, setUnreadCount: setGlobalUnreadCount } = useRealtime();

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadNotifications = useCallback(
    async (p = 1, replace = true) => {
      if (replace) setLoading(true);
      try {
        const [notifRes, countRes] = await Promise.allSettled([
          getNotifications(p, PAGE_SIZE),
          getUnreadCount(),
        ]);

        if (
          notifRes.status === "fulfilled" &&
          notifRes.value.isSuccess
        ) {
          const items = notifRes.value.data.items;
          setTotalCount(notifRes.value.data.totalCount);
          setNotifications((prev) =>
            replace ? items : [...prev, ...items],
          );
        }
        if (
          countRes.status === "fulfilled" &&
          countRes.value.isSuccess
        ) {
          setUnreadCount(countRes.value.data);
        }
      } catch {
        toast({ title: "Failed to load notifications.", variant: "destructive" });
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadNotifications(1, true);
  }, [loadNotifications]);

  // ── Realtime: new notification ─────────────────────────────────────────────
  useSignalREvent<NotificationPayload>(
    REALTIME_EVENTS.RECEIVE_NOTIFICATION,
    useCallback((payload) => {
      const item: NotificationDto = {
        id: payload.id,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        actionUrl: payload.actionUrl,
        isRead: false,
        createdAt: payload.createdAt,
      };
      setNotifications((prev) => [item, ...prev]);
      setUnreadCount((c) => c + 1);
    }, []),
  );

  // ── Realtime: server confirmed read ────────────────────────────────────────
  useSignalREvent<{ id: string }>(
    REALTIME_EVENTS.NOTIFICATION_READ,
    useCallback(({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    }, []),
  );

  // ── Realtime: server confirmed all read ───────────────────────────────────
  useSignalREvent(
    REALTIME_EVENTS.ALL_NOTIFICATIONS_READ,
    useCallback(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }, []),
  );

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMarkRead = useCallback(
    async (id: string) => {
      // Only decrement if the notification was unread
      const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      if (wasUnread) {
        setUnreadCount((c) => Math.max(0, c - 1));
        decrementUnread(); // sync global header badge
      }
      try {
        await markNotificationRead(id);
      } catch {
        // Rollback on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
        if (wasUnread) {
          setUnreadCount((c) => c + 1);
          setGlobalUnreadCount(unreadCount + 1);
        }
        toast({ title: "Failed to mark notification as read.", variant: "destructive" });
      }
    },
    [toast, notifications, unreadCount, decrementUnread, setGlobalUnreadCount],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (marking) return;
    setMarking(true);
    const prevNotifs = notifications;
    const prevCount = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    resetUnread(); // sync global header badge
    try {
      await markAllNotificationsRead();
    } catch {
      // Rollback
      setNotifications(prevNotifs);
      setUnreadCount(prevCount);
      setGlobalUnreadCount(prevCount);
      toast({ title: "Failed to mark all as read.", variant: "destructive" });
    } finally {
      setMarking(false);
    }
  }, [marking, notifications, unreadCount, toast, resetUnread, setGlobalUnreadCount]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, false);
  };

  const hasMore = notifications.length < totalCount;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Bell className="h-7 w-7 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay up to date with academy activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">
              {unreadCount} unread
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadNotifications(1, true)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={marking}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Notification List ────────────────────────────────────────────── */}
      <Card className="card-athletic">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-muted-foreground font-medium">
            {loading
              ? "Loading..."
              : `${totalCount} notification${totalCount !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationList
            notifications={notifications}
            loading={loading}
            onMarkRead={handleMarkRead}
          />

          {/* Load more */}
          {!loading && hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
