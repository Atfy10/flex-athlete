import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, the user must have this role or they are redirected to "/" */
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { token, expiresAt, devUser, hasRole } = useAuth();

  const isValid =
    !!devUser ||
    (!!token && !!expiresAt && expiresAt > Date.now());

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
