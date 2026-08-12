import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RESET_PASSWORD_PATH } from "@/config/appUrl";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Auth guard priority:
 * 1. recovery route  2. recovery mode  3. loading  4. authenticated  5. role resolved  6. role shell
 */
const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading, isRecovery } = useAuth();
  const location = useLocation();

  // 1 & 2 — password recovery always wins over role routing.
  if (location.pathname.startsWith(RESET_PASSWORD_PATH)) return <>{children}</>;
  if (isRecovery) return <Navigate to={RESET_PASSWORD_PATH} replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isFounder = user.email?.toLowerCase() === "ilomuche@gmail.com";
  if (allowedRoles && role && !allowedRoles.includes(role) && !(isFounder && allowedRoles.includes("admin"))) {
    return <Navigate to={`/dashboard/${role}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
