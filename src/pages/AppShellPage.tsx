import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, RefreshCw } from "lucide-react";
import DashboardPage from "@/pages/DashboardPage";
import RoleTabBar from "@/components/RoleTabBar";
import ChangePasswordCard from "@/components/security/ChangePasswordCard";
import SupportButton from "@/components/SupportButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { roleTabs, shellRole } from "@/config/roleTabs";

const AppShellPage = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { user, role, loading, signOut } = useAuth();

  const key = shellRole(role);
  const tabs = roleTabs[key];

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!tabs) {
      // Roles without a shell (admin, support) keep the classic dashboard.
      navigate(role ? `/dashboard/${key || "admin"}` : "/", { replace: true });
      return;
    }
    if (!tab || !tabs.some((t) => t.key === tab)) {
      navigate(`/app/${tabs[0].key}`, { replace: true });
    }
  }, [loading, user, role, key, tabs, tab, navigate]);

  if (loading || !tabs || !tab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const current = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="p-4 md:p-8 pb-32 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start justify-between gap-4"
        >
          <div>
            <p className="font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {key}
            </p>
            <h1 className="font-display text-3xl font-bold text-foreground">{current.label}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-body"
            onClick={() => {
              signOut();
              navigate("/");
            }}
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Log out
          </Button>
        </motion.div>

        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <DashboardPage role={key} embedded navKey={current.nav} />

          {current.nav === "Settings" && (
            <div className="mt-6">
              <ChangePasswordCard />
            </div>
          )}
        </motion.div>
      </div>

      <RoleTabBar
        items={tabs}
        active={current.key}
        onSelect={(k) => navigate(`/app/${k}`)}
      />
      <SupportButton />
    </div>
  );
};

export default AppShellPage;
