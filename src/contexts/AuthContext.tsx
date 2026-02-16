import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "@/lib/api";

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  emailConfirmed?: boolean;
}

interface LoginResponse {
  accessToken: string;
  expiresAt: string;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem("accessToken");
    const expiresAt = localStorage.getItem("expiresAt");
    const isExpired = expiresAt ? new Date(expiresAt) < new Date() : true;
    return {
      token: isExpired ? null : token,
      expiresAt: isExpired ? null : expiresAt,
      isAuthenticated: !isExpired && !!token,
    };
  });

  useEffect(() => {
    if (auth.expiresAt) {
      const timeout = new Date(auth.expiresAt).getTime() - Date.now();
      if (timeout > 0) {
        const timer = setTimeout(() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("expiresAt");
          setAuth({ token: null, expiresAt: null, isAuthenticated: false });
        }, timeout);
        return () => clearTimeout(timer);
      }
    }
  }, [auth.expiresAt]);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("expiresAt", data.expiresAt);
    setAuth({
      token: data.accessToken,
      expiresAt: data.expiresAt,
      isAuthenticated: true,
    });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const payloadToSend = {
      userName: payload.userName,
      email: payload.email,
      password: payload.password,
      phoneNumber: payload.phoneNumber ?? "",
      emailConfirmed: payload.emailConfirmed ?? true,
    };
    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payloadToSend),
      skipAuth: true,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("expiresAt");
    setAuth({ token: null, expiresAt: null, isAuthenticated: false });
  }, []);

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
