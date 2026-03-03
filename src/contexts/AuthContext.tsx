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

interface AuthState {
  token: string | null;
  // milliseconds since epoch
  expiresAt: number | null;
  isAuthenticated: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
  // rememberMe?: boolean;
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
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Constants for localStorage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  EXPIRES_AT: "expiresAt",
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    expiresAt: null,
    isAuthenticated: false,
  });

  const timerRef = React.useRef<number | null>(null);
  const isLoggingOutRef = React.useRef(false);

  // Helper function to check if token is expired
  const isTokenExpired = useCallback((expiresAt: number | null): boolean => {
    if (!expiresAt) return true;
    return expiresAt <= Date.now();
  }, []);

  // Bootstrap: restore auth state from localStorage on initial load
  useEffect(() => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

      if (!token || !expiresAtStr) {
        // No saved session
        return;
      }

      const expiresAt = parseInt(expiresAtStr, 10);

      // Validate the token and expiration
      if (isNaN(expiresAt) || isTokenExpired(expiresAt)) {
        // Token expired, clear storage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
        return;
      }

      // Validate JWT format
      const parts = token.split(".");
      if (parts.length < 2) throw new Error("Invalid JWT");

      // Optional: verify the exp in JWT matches our stored expiresAt
      const payload = JSON.parse(atob(parts[1])) as { exp?: number | string };
      const jwtExp = Number(payload?.exp) * 1000;

      if (jwtExp !== expiresAt) {
        // Mismatch - use the JWT exp as source of truth
        console.warn("JWT exp mismatch with stored expiresAt");
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, jwtExp.toString());
        setAuth({
          token,
          expiresAt: jwtExp,
          isAuthenticated: !isTokenExpired(jwtExp),
        });
        setApiAccessToken(token);
      } else {
        setAuth({ token, expiresAt, isAuthenticated: true });
        setApiAccessToken(token);
      }
    } catch (error) {
      console.error("Failed to restore auth state:", error);
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    }
  }, [isTokenExpired]);

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

      const expiresAt = exp * 1000; // Convert to milliseconds

      if (!token || !expiresAt) {
        throw new Error("Invalid token from server");
      }

      // Save to localStorage for persistence
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

      setAuth({
        token,
        expiresAt,
        isAuthenticated: true, // We know it's valid now
      });

      setApiAccessToken(token);
    } catch (err) {
      console.error("Login error:", err);
      throw new Error("Failed to process authentication response");
    }
  }, []);

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

    if (!result.isSuccess) {
      throw new Error(result.message);
    }
  }, []);

  const logout = useCallback(() => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);

      // Clear API token
      clearApiAccessToken();

      // Clear auth state
      setAuth({ token: null, expiresAt: null, isAuthenticated: false });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      isLoggingOutRef.current = false;
    }
  }, []);

  // Auto logout timer using numeric expiresAt (ms)
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Only set timer if we have a valid future expiration
    if (auth.expiresAt && auth.isAuthenticated) {
      const timeUntilExpiry = auth.expiresAt - Date.now();

      if (timeUntilExpiry <= 0) {
        // Already expired - logout immediately
        logout();
      } else {
        // Set timer for exact expiration time
        timerRef.current = window.setTimeout(() => {
          // Double-check the expiration hasn't changed
          const currentExpiresAt = localStorage.getItem(
            STORAGE_KEYS.EXPIRES_AT,
          );
          const storedExpiresAt = currentExpiresAt
            ? parseInt(currentExpiresAt, 10)
            : null;

          // Only logout if the expiration time matches what we expect
          if (storedExpiresAt === auth.expiresAt) {
            logout();
          }
        }, timeUntilExpiry);
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [auth.expiresAt, auth.isAuthenticated, logout]);

  // Optional: Add window focus check to verify token status when tab becomes active
  useEffect(() => {
    const handleFocus = () => {
      if (auth.token && auth.expiresAt) {
        if (isTokenExpired(auth.expiresAt)) {
          logout();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [auth.token, auth.expiresAt, logout, isTokenExpired]);

  // Register logout handler with API module for 401 responses
  useEffect(() => {
    registerApiLogoutHandler(() => {
      // Check if we're already logging out
      if (!isLoggingOutRef.current) {
        logout();
      }
    });
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
