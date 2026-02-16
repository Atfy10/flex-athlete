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

interface ApiResult<T> {
  data: T;
  isSuccess: boolean;
  operationType: string;
  message: string;
  statusCode: number;
}

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    expiresAt: null,
    isAuthenticated: false,
  });

  const timerRef = React.useRef<number | null>(null);
  const isLoggingOutRef = React.useRef(false);

  // Bootstrap: restore token from localStorage once, then remove it.
  useEffect(() => {
    const saved = localStorage.getItem("accessToken");
    if (!saved) return;

    try {
      const parts = saved.split(".");
      if (parts.length < 2) throw new Error("Invalid JWT");
      const payload = JSON.parse(atob(parts[1])) as { exp?: number | string };
      const exp = Number(payload?.exp);
      if (!isNaN(exp)) {
        const expiresAt = exp * 1000;
        if (expiresAt > Date.now()) {
          setAuth({ token: saved, expiresAt, isAuthenticated: true });
          // inform api layer of current token
          setApiAccessToken(saved);
        }
      }
    } catch (e) {
      void 0;
    } finally {
      // remove from storage regardless: localStorage should not be the session store
      try {
        localStorage.removeItem("accessToken");
      } catch (err) {
        void 0;
      }
    }
  }, []);

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
    // decode JWT and extract exp (seconds) as single source of truth
    try {
      const parts = token.split(".");
      if (parts.length < 2) throw new Error("Invalid JWT");
      const payloadObj = JSON.parse(atob(parts[1])) as {
        exp?: number | string;
      };
      const exp = Number(payloadObj?.exp);
      const expiresAt = isNaN(exp) ? null : exp * 1000;

      if (!token || !expiresAt) throw new Error("Invalid token from server");

      setAuth({
        token,
        expiresAt,
        isAuthenticated: expiresAt > Date.now(),
      });
      // set token in api layer (in-memory)
      setApiAccessToken(token);
      // persist to localStorage only to survive page reload; will be removed during bootstrap
      try {
        localStorage.setItem("accessToken", token);
      } catch (err) {
        void 0;
      }
    } catch (err) {
      void 0;
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
      try {
        localStorage.removeItem("accessToken");
      } catch (err) {
        void 0;
      }
      try {
        clearApiAccessToken();
      } catch (err) {
        void 0;
      }
      setAuth({ token: null, expiresAt: null, isAuthenticated: false });
    } finally {
      isLoggingOutRef.current = false;
    }
  }, []);

  // Auto logout timer using numeric expiresAt (ms)
  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (auth.expiresAt) {
      const timeout = auth.expiresAt - Date.now();
      if (timeout <= 0) {
        // expired already — logout immediately
        logout();
      } else {
        timerRef.current = window.setTimeout(() => {
          logout();
        }, timeout);
      }
    }

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [auth.expiresAt, logout]);

  // register logout handler with API module so 401 responses trigger single-flight logout
  useEffect(() => {
    registerApiLogoutHandler(() => {
      logout();
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
