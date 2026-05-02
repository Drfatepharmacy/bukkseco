import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole =
  | "buyer"
  | "vendor"
  | "farmer"
  | "rider"
  | "admin"
  | "super_admin"
  | "tenant_admin"
  | "support_agent"
  | "vendor_staff";

/**
 * Fetches all roles for the current user (concurrent roles supported).
 * Use this instead of AuthContext.role when you need full RBAC checks.
 */
export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (!cancelled) {
        setRoles((data || []).map((r) => r.role as AppRole));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const has = (role: AppRole) => roles.includes(role);
  const hasAny = (list: AppRole[]) => list.some((r) => roles.includes(r));
  const isAdmin = hasAny(["admin", "super_admin", "tenant_admin"]);

  return { roles, loading, has, hasAny, isAdmin };
}
