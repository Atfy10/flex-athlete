import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, expiresAt } = useAuth();

  const isValid = !!token && !!expiresAt && expiresAt > Date.now();

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
