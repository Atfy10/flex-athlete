/**
 * dev-login.ts
 *
 * Development-only login bypass.
 *
 * Active ONLY when ALL three conditions hold:
 *   1. import.meta.env.DEV === true   (Vite development build)
 *   2. import.meta.env.VITE_ENABLE_DEV_LOGIN === "true"  (opt-in flag)
 *   3. email === DEV_EMAIL
 *
 * In production builds Vite tree-shakes this entire module because
 * import.meta.env.DEV is statically replaced with `false`, making every
 * guard a dead branch.
 *
 * ⚠️  NEVER import this module in production-only code paths.
 */

import { ApiResult } from "@/types/api";

export const DEV_EMAIL = "developer@aura.com" as const;

/** localStorage key that stores the mock session flag */
export const DEV_SESSION_KEY = "__dev_session__" as const;

export interface DevUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

/** The mock user injected when dev login succeeds */
export const DEV_MOCK_USER: DevUser = {
  id: "dev-user-001",
  email: DEV_EMAIL,
  role: "Admin",
  name: "Developer",
} as const;

/**
 * Returns true if the dev-login bypass is currently enabled.
 * Both the build mode AND the feature flag must be set.
 */
export function isDevLoginEnabled(): boolean {
  return (
    import.meta.env.DEV === true &&
    import.meta.env.VITE_ENABLE_DEV_LOGIN === "true"
  );
}

/**
 * Returns true when a dev session is currently active in localStorage.
 * Safe to call from service files — returns false instantly in production.
 */
export function isDevSession(): boolean {
  if (!isDevLoginEnabled()) return false;
  try {
    const raw = localStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return false;
    const user = JSON.parse(raw) as DevUser;
    return user?.email === DEV_EMAIL;
  } catch {
    return false;
  }
}

/**
 * Returns a mock ApiResult<T> for dev mode.
 *
 * Usage in any service function:
 *   if (isDevSession()) return devMock<MyType>(null);
 *
 * The UI receives a valid, typed result and renders its empty/default state
 * without triggering any network request.
 */
export function devMock<T>(data: T, message = "Dev mode: API call skipped"): ApiResult<T> {
  return {
    data,
    isSuccess: true,
    operationType: "Dev",
    message,
    statusCode: 200,
  };
}

/**
 * Attempts a dev login for the given email.
 *
 * @returns The mock DevUser when all conditions match, otherwise null.
 *          Null means the caller should fall through to real authentication.
 *
 * Side-effects: writes DEV_SESSION_KEY to localStorage on success.
 */
export function attemptDevLogin(email: string): DevUser | null {
  if (!isDevLoginEnabled()) return null;
  if (email.trim().toLowerCase() !== DEV_EMAIL) return null;

  localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(DEV_MOCK_USER));
  return DEV_MOCK_USER;
}

/**
 * Reads a previously stored dev session from localStorage.
 * Returns null when in production or when no dev session exists.
 */
export function restoreDevSession(): DevUser | null {
  if (!isDevLoginEnabled()) return null;
  try {
    const raw = localStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DevUser;
  } catch {
    return null;
  }
}

/**
 * Clears the dev session from localStorage.
 * Safe to call unconditionally — is a no-op outside development.
 */
export function clearDevSession(): void {
  localStorage.removeItem(DEV_SESSION_KEY);
}
