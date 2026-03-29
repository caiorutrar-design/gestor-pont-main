import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface ColaboradorRouteProps {
  children: React.ReactNode;
}

export function ColaboradorRoute({ children }: ColaboradorRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, isSuperAdmin, isGestor, isLoading: roleLoading, role } = useIsAdmin();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only 'user' role (colaboradores) can access this
  if (isAdmin || isSuperAdmin || isGestor) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
