import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { isDevSession, devMock } from "@/auth/dev-login";

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// ── Dev-mode mock data ───────────────────────────────────────────────────────
const DEV_NOTIFICATIONS: NotificationDto[] = [
  {
    id: "dev-notif-1",
    title: "New Enrollment",
    message: "Ahmed Ali has enrolled in Basketball – Main Campus.",
    type: "enrollment",
    actionUrl: "/enrollments",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "dev-notif-2",
    title: "Attendance Marked",
    message: "Session #102 attendance has been recorded (18/20 present).",
    type: "attendance",
    actionUrl: "/attendance",
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "dev-notif-3",
    title: "Session Cancelled",
    message: "Tuesday morning Swimming session has been cancelled.",
    type: "session",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dev-notif-4",
    title: "New Trainee Registered",
    message: "Sara Hassan has been added as a new trainee in Tennis.",
    type: "trainee",
    actionUrl: "/trainees",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dev-notif-5",
    title: "Coach Schedule Updated",
    message: "Coach Mohammed's weekly schedule has been updated.",
    type: "system",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// In-memory state for dev mock (survives within a session)
let _devNotifications = [...DEV_NOTIFICATIONS];

// ── Service functions ────────────────────────────────────────────────────────

/** Fetch paginated notifications for the current user. */
export function getNotifications(page = 1, pageSize = 20) {
  if (isDevSession()) {
    const start = (page - 1) * pageSize;
    const items = _devNotifications.slice(start, start + pageSize);
    return Promise.resolve(
      devMock<PagedData<NotificationDto>>({
        items,
        totalCount: _devNotifications.length,
        page,
        pageSize,
      }),
    );
  }
  return apiFetch<ApiResult<PagedData<NotificationDto>>>(
    `/api/notifications?page=${page}&pageSize=${pageSize}`,
  );
}

/** Get unread notification count. */
export function getUnreadCount() {
  if (isDevSession()) {
    const count = _devNotifications.filter((n) => !n.isRead).length;
    return Promise.resolve(devMock<number>(count));
  }
  return apiFetch<ApiResult<number>>("/api/notifications/unread-count");
}

/** Mark a single notification as read. */
export function markNotificationRead(id: string) {
  if (isDevSession()) {
    _devNotifications = _devNotifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    return Promise.resolve(devMock<null>(null));
  }
  return apiFetch<ApiResult<null>>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

/** Mark all notifications as read. */
export function markAllNotificationsRead() {
  if (isDevSession()) {
    _devNotifications = _devNotifications.map((n) => ({ ...n, isRead: true }));
    return Promise.resolve(devMock<null>(null));
  }
  return apiFetch<ApiResult<null>>("/api/notifications/read-all", {
    method: "PATCH",
  });
}
