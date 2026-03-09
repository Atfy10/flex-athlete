import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  apiFetch,
  setAccessToken as setApiAccessToken,
  registerLogoutHandler as registerApiLogoutHandler,
  clearAccessToken as clearApiAccessToken,
} from "@/lib/api";
import { ApiResult } from "@/types/api";
import {
  attemptDevLogin,
  restoreDevSession,
  clearDevSession,
  DevUser,
} from "@/auth/dev-login";

interface AuthState {
  token: string | null;
  // milliseconds since epoch
  expiresAt: number | null;
  isAuthenticated: boolean;
  /** Roles decoded from the JWT (or from the dev user) */
  roles: string[];
  /** Populated only during a dev-login session; null in production */
  devUser: DevUser | null;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
  phoneNumber: string;
  emailConfirmed?: boolean;
}

type LoginResponse = ApiResult<string>;

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  /** Dev-only login — no-op and throws in production */
  loginDev: (email: string) => void;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  /** Returns true if the logged-in user has ANY of the given roles */
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Constants for sessionStorage keys (sessionStorage clears on tab/window close,
// reducing the window of exposure vs. localStorage while keeping the UX identical)
const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  EXPIRES_AT: "expiresAt",
} as const;

/** Extract roles from a raw JWT string. Returns [] on any error. */
function decodeRoles(token: string): string[] {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return [];
    const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
    // ASP.NET Core uses the full ClaimTypes URI as key
    const roleKey =
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const raw = payload[roleKey] ?? payload["role"] ?? payload["roles"];
    if (!raw) return [];
    return Array.isArray(raw) ? (raw as string[]) : [raw as string];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    expiresAt: null,
    isAuthenticated: false,
    roles: [],
    devUser: null,
  });

  const timerRef = React.useRef<number | null>(null);
  const isLoggingOutRef = React.useRef(false);

  // Helper function to check if token is expired
  const isTokenExpired = useCallback((expiresAt: number | null): boolean => {
    if (!expiresAt) return true;
    return expiresAt <= Date.now();
  }, []);

  // ── Bootstrap: restore auth state from sessionStorage on initial load ───────
  useEffect(() => {
    // ── 1. Dev session takes priority ──────────────────────────────────────
    const devUser = restoreDevSession();
    if (devUser) {
      setAuth({
        token: null,
        expiresAt: null,
        isAuthenticated: true,
        roles: [devUser.role],
        devUser,
      });
      return;
    }

    // ── 2. Real JWT session ────────────────────────────────────────────────
    try {
      const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAtStr = sessionStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

      if (!token || !expiresAtStr) return;

      const expiresAt = parseInt(expiresAtStr, 10);

      if (isNaN(expiresAt) || isTokenExpired(expiresAt)) {
        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
        return;
      }

      const parts = token.split(".");
      if (parts.length < 2) throw new Error("Invalid JWT");

      const payload = JSON.parse(atob(parts[1])) as { exp?: number | string };
      const jwtExp = Number(payload?.exp) * 1000;

      if (jwtExp !== expiresAt) {
        console.warn("JWT exp mismatch with stored expiresAt");
        sessionStorage.setItem(STORAGE_KEYS.EXPIRES_AT, jwtExp.toString());
        setAuth({
          token,
          expiresAt: jwtExp,
          isAuthenticated: !isTokenExpired(jwtExp),
          roles: decodeRoles(token),
          devUser: null,
        });
        setApiAccessToken(token);
      } else {
        setAuth({ token, expiresAt, isAuthenticated: true, roles: decodeRoles(token), devUser: null });
        setApiAccessToken(token);
      }
    } catch (error) {
      console.error("Failed to restore auth state:", error);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    }
  }, [isTokenExpired]);

  // ── loginDev ───────────────────────────────────────────────────────────────
  const loginDev = useCallback((email: string) => {
    const user = attemptDevLogin(email);
    if (!user) {
      throw new Error(
        "Dev login failed: check VITE_ENABLE_DEV_LOGIN and email.",
      );
    }
    setAuth({
      token: null,
      expiresAt: null,
      isAuthenticated: true,
      roles: [user.role],
      devUser: user,
    });
  }, []);

  // ── login (real) ───────────────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginPayload) => {
    const result = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        userNameOrEmail: payload.email,
        password: payload.password,
      }),
      skipAuth: true,
    });

    if (!result.isSuccess) {
      throw new Error(result.message);
    }

    const token = result.data;

    try {
      const parts = token.split(".");
      if (parts.length < 2) throw new Error("Invalid JWT");

      const payloadObj = JSON.parse(atob(parts[1])) as {
        exp?: number | string;
      };

      const exp = Number(payloadObj?.exp);
      if (isNaN(exp)) throw new Error("Invalid expiration in token");

      const expiresAt = exp * 1000;

      if (!token || !expiresAt) throw new Error("Invalid token from server");

      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      sessionStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

      setAuth({ token, expiresAt, isAuthenticated: true, roles: decodeRoles(token), devUser: null });
      setApiAccessToken(token);
    } catch (err) {
      console.error("Login error:", err);
      throw new Error("Failed to process authentication response");
    }
  }, []);

  // ── register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (payload: RegisterPayload) => {
    const payloadToSend = {
      userName: payload.userName,
      email: payload.email,
      password: payload.password,
      phoneNumber: payload.phoneNumber ?? "",
      emailConfirmed: payload.emailConfirmed ?? true,
    };

    const result = await apiFetch<ApiResult<string>>("/api/auth/sign-up", {
      method: "POST",
      body: JSON.stringify(payloadToSend),
      skipAuth: true,
    });

    if (!result.isSuccess) throw new Error(result.message);
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      // Clear real session
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
      clearApiAccessToken();

      // Clear dev session (safe no-op in production)
      clearDevSession();

      setAuth({ token: null, expiresAt: null, isAuthenticated: false, roles: [], devUser: null });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      isLoggingOutRef.current = false;
    }
  }, []);

  // ── hasRole ────────────────────────────────────────────────────────────────
  const hasRole = useCallback((...rolesToCheck: string[]): boolean => {
    return rolesToCheck.some((r) =>
      auth.roles.some((ur) => ur.toLowerCase() === r.toLowerCase())
    );
  }, [auth.roles]);

  // ── Auto-logout timer (real sessions only) ─────────────────────────────────
  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Dev sessions never expire
    if (auth.devUser) return;

    if (auth.expiresAt && auth.isAuthenticated) {
      const timeUntilExpiry = auth.expiresAt - Date.now();

      if (timeUntilExpiry <= 0) {
        logout();
      } else {
        timerRef.current = window.setTimeout(() => {
          const currentExpiresAt = sessionStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
          const storedExpiresAt = currentExpiresAt
            ? parseInt(currentExpiresAt, 10)
            : null;
          if (storedExpiresAt === auth.expiresAt) logout();
        }, timeUntilExpiry);
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [auth.expiresAt, auth.isAuthenticated, auth.devUser, logout]);

  // ── Window focus expiry check (real sessions only) ─────────────────────────
  useEffect(() => {
    const handleFocus = () => {
      if (auth.devUser) return; // dev sessions don't expire
      if (auth.token && auth.expiresAt && isTokenExpired(auth.expiresAt)) {
        logout();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [auth.token, auth.expiresAt, auth.devUser, logout, isTokenExpired]);

  // ── Register global 401 logout handler ────────────────────────────────────
  useEffect(() => {
    registerApiLogoutHandler(() => {
      if (!isLoggingOutRef.current) logout();
    });
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...auth, login, loginDev, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
