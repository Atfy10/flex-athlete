import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectionManager } from "@/realtime/connectionManager";
import { useSignalREvent } from "@/realtime/useSignalREvent";
import { REALTIME_EVENTS, NotificationPayload } from "@/realtime/realtimeEvents";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getUnreadCount } from "@/services/notifications.service";

interface RealtimeContextValue {
  unreadCount: number;
  incrementUnread: () => void;
  decrementUnread: () => void;
  resetUnread: () => void;
  setUnreadCount: (n: number) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
  /** Initial unread count hydrated from API on mount */
  initialUnreadCount?: number;
}

/**
 * Manages the SignalR connection lifecycle and exposes a shared unread-count
 * to the rest of the app. Mount this once inside the authenticated layout.
 */
export function RealtimeProvider({ children, initialUnreadCount = 0 }: RealtimeProviderProps) {
  const { token, isAuthenticated, devUser } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const startedRef = useRef(false);

  // ── Hydrate unread count from API on mount ────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    getUnreadCount().then((res) => {
      if (res.isSuccess) setUnreadCount(res.data);
    }).catch(() => {/* silent */});
  }, [isAuthenticated]);

  // ── Connect on auth, disconnect on logout ──────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      connectionManager.stop();
      startedRef.current = false;
      return;
    }

    // Dev sessions don't carry a JWT token — skip connecting.
    if (devUser) return;

    if (!token || startedRef.current) return;
    startedRef.current = true;

    connectionManager.start(() => token);

    return () => {
      // Do NOT stop connection on every effect cleanup (re-renders).
      // Connection is stopped only explicitly on logout above.
    };
  }, [isAuthenticated, token, devUser]);

  // ── Query invalidation handlers ────────────────────────────────────────
  useSignalREvent(REALTIME_EVENTS.ATTENDANCE_UPDATED, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
  }, [queryClient]));

  useSignalREvent(REALTIME_EVENTS.SESSION_OCCURRENCE_UPDATED, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["sessionOccurrences"] });
  }, [queryClient]));

  useSignalREvent(REALTIME_EVENTS.ENROLLMENT_UPDATED, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["enrollments"] });
  }, [queryClient]));

  useSignalREvent(REALTIME_EVENTS.DASHBOARD_STATS_UPDATED, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]));

  useSignalREvent(REALTIME_EVENTS.TRAINEE_GROUP_UPDATED, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["traineeGroups"] });
  }, [queryClient]));

  // ── Notification events ────────────────────────────────────────────────
  useSignalREvent<NotificationPayload>(
    REALTIME_EVENTS.RECEIVE_NOTIFICATION,
    useCallback((payload) => {
      setUnreadCount((c) => c + 1);
      // Show a toast for every incoming notification
      toast({
        title: payload.title,
        description: payload.message,
      });
    }, []),
  );

  useSignalREvent(
    REALTIME_EVENTS.ALL_NOTIFICATIONS_READ,
    useCallback(() => setUnreadCount(0), []),
  );

  useSignalREvent<{ id: string }>(
    REALTIME_EVENTS.NOTIFICATION_READ,
    useCallback(() => {
      setUnreadCount((c) => Math.max(0, c - 1));
    }, []),
  );

  const incrementUnread = useCallback(() => setUnreadCount((c) => c + 1), []);
  const decrementUnread = useCallback(() => setUnreadCount((c) => Math.max(0, c - 1)), []);
  const resetUnread = useCallback(() => setUnreadCount(0), []);

  return (
    <RealtimeContext.Provider
      value={{ unreadCount, incrementUnread, decrementUnread, resetUnread, setUnreadCount }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
