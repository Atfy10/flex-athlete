import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountDto {
  count: number;
}

/** Fetch paginated notifications for the current user. */
export function getNotifications(page = 1, pageSize = 20) {
  return apiFetch<ApiResult<PagedData<NotificationDto>>>(
    `/api/notifications?page=${page}&pageSize=${pageSize}`,
  );
}

/** Get unread notification count. */
export function getUnreadCount() {
  return apiFetch<ApiResult<number>>("/api/notifications/unread-count");
}

/** Mark a single notification as read. */
export function markNotificationRead(id: string) {
  return apiFetch<ApiResult<null>>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

/** Mark all notifications as read. */
export function markAllNotificationsRead() {
  return apiFetch<ApiResult<null>>("/api/notifications/read-all", {
    method: "PATCH",
  });
}
