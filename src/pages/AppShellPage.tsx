import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, RefreshCw } from "lucide-react";
import DashboardPage from "@/pages/DashboardPage";
import RoleTabBar from "@/components/RoleTabBar";
import ChangePasswordCard from "@/components/security/ChangePasswordCard";
import CartSheet from "@/components/bukks/CartSheet";
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
    if (!role) return; // role still resolving
    if (!tabs) {
      // Roles without a shell (admin, support) keep the classic dashboard.
      navigate(`/dashboard/${key}`, { replace: true });
      return;
    }
    if (!tab || !tabs.some((t) => t.key === tab)) {
      navigate(`/app/${tabs[0].key}`, { replace: true });
    }
  }, [loading, user, role, key, tabs, tab, navigate]);

  if (loading || !role || !tabs || !tab || !tabs.some((t) => t.key === tab)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  const current = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <div className="min-h-[100dvh] bg-background">
      <header
        className="sticky top-0 z-30 border-b border-border bg-background"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <h1 className="font-display text-xl font-bold text-foreground">{current.label}</h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Log out"
            className="h-11 w-11"
            onClick={() => {
              signOut();
              navigate("/");
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4 pb-safe-nav">
        <motion.div
          key={current.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <DashboardPage role={key} embedded navKey={current.nav} />

          {current.nav === "Settings" && (
            <div className="mt-6">
              <ChangePasswordCard />
            </div>
          )}
        </motion.div>
      </main>

      {key === "student" && <CartSheet />}
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
