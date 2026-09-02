import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import { FullScreenLoading } from "@/components/Loading";
import type { UserRole } from "@/types";

export function ProtectedRoute({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoading />;

  if (!user) return <Navigate to="/giris" replace />;

  if (user.role !== role) {
    const fallback = user.role === "Admin" ? "/admin" : user.role === "Firma" ? "/company" : "/giris";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
