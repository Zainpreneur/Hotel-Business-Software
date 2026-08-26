import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-slate-500">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        You do not have permission to view this page.
      </div>
    );
  }
  return <>{children}</>;
}
