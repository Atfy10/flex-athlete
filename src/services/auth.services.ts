/**
 * auth.services.ts
 *
 * Service layer for auth-related API calls (users, roles, profile, password).
 * All functions respect the dev session guard — no HTTP calls are made
 * when a dev session is active.
 */

import { apiFetch } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { isDevSession, devMock, DEV_MOCK_USER } from "@/auth/dev-login";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  isActive: boolean;
}

export interface MyProfileDto {
  id: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  roles?: string[];
  createdAt?: string;
}

export interface CreateUserPayload {
  userName: string;
  email: string;
  password: string;
  roles: string[];
  isActive: boolean;
}

// ── Service functions ─────────────────────────────────────────────────────────

export const getUsers = async (): Promise<ApiResult<AppUser[]>> => {
  if (isDevSession()) {
    return devMock<AppUser[]>([
      {
        id: DEV_MOCK_USER.id,
        userName: DEV_MOCK_USER.name,
        email: DEV_MOCK_USER.email,
        roles: [DEV_MOCK_USER.role],
        isActive: true,
      },
    ]);
  }
  return apiFetch<ApiResult<AppUser[]>>("/api/auth/users");
};

export const getRoles = async (): Promise<ApiResult<string[]>> => {
  if (isDevSession()) return devMock<string[]>(["Admin", "Manager", "Coach"]);
  return apiFetch<ApiResult<string[]>>("/api/auth/roles");
};

export const toggleUserActive = async (userId: string): Promise<ApiResult<boolean>> => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/auth/users/${userId}/toggle-active`, { method: "POST" });
};

export const createUser = async (payload: CreateUserPayload): Promise<ApiResult<boolean>> => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>("/api/auth/users/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getMyProfile = async (): Promise<ApiResult<MyProfileDto>> => {
  if (isDevSession()) {
    return devMock<MyProfileDto>({
      id: DEV_MOCK_USER.id,
      userName: DEV_MOCK_USER.name,
      email: DEV_MOCK_USER.email,
      roles: [DEV_MOCK_USER.role],
    });
  }
  return apiFetch<ApiResult<MyProfileDto>>("/api/user/me");
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<ApiResult<boolean>> => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};
