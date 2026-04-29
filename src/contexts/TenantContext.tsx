import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  settings: any;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  isDefault: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  isDefault: true,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    const detectTenant = async () => {
      const hostname = window.location.hostname;
      const parts = hostname.split(".");

      // Handle local development (e.g., uniben.localhost) or subdomains
      let slug = "uniben"; // Default to uniben for now if not found

      if (parts.length > 2 || (parts.length === 2 && hostname.includes("localhost"))) {
        slug = parts[0];
        if (slug === "www" || slug === "app") {
          slug = "uniben";
        }
      }

      try {
        const { data, error } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", slug)
          .single();

        if (data) {
          setTenant(data);
          setIsDefault(false);

          // Apply custom colors if present
          if (data.primary_color) {
             document.documentElement.style.setProperty('--primary', data.primary_color);
          }
        }
      } catch (err) {
        console.error("Tenant detection error:", err);
      } finally {
        setLoading(false);
      }
    };

    detectTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading, isDefault }}>
      {children}
    </TenantContext.Provider>
  );
};
