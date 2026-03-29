import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logError } from "@/lib/logger";

export type AppRole = "super_admin" | "admin" | "gestor" | "user";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        logError("useUserRole", error);
        return null;
      }

      return data as UserRole | null;
    },
    enabled: !!user?.id,
  });
}

export function useIsAdmin() {
  const { data: roleData, isLoading } = useUserRole();

  return {
    isAdmin: roleData?.role === "admin" || roleData?.role === "super_admin",
    isSuperAdmin: roleData?.role === "super_admin",
    isGestor: roleData?.role === "gestor",
    isLoading,
    role: (roleData?.role as AppRole) || null,
  };
}
