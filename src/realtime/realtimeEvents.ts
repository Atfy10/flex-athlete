/**
 * Typed catalog of every SignalR server-to-client event name.
 * Keep in sync with the .NET Hub method names.
 */
export const REALTIME_EVENTS = {
  // Notification events
  RECEIVE_NOTIFICATION: "ReceiveNotification",
  NOTIFICATION_READ: "NotificationRead",
  ALL_NOTIFICATIONS_READ: "AllNotificationsRead",

  // Domain update events (used for React Query invalidation)
  ATTENDANCE_UPDATED: "AttendanceUpdated",
  SESSION_OCCURRENCE_UPDATED: "SessionOccurrenceUpdated",
  ENROLLMENT_UPDATED: "EnrollmentUpdated",
  DASHBOARD_STATS_UPDATED: "DashboardStatsUpdated",
  TRAINEE_GROUP_UPDATED: "TraineeGroupUpdated",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/** Shape of a notification payload pushed from the server */
export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "attendance"
  | "enrollment"
  | "session"
  | "system";
