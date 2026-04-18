import { dashboardConfigs } from "@/config/dashboardConfig";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/StatCard";
import DashboardSidebar from "@/components/DashboardSidebar";
import AdminApprovals from "@/components/AdminApprovals";
import { AdminSettings } from "@/components/AdminSettings";
import OrdersList from "@/components/OrdersList";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import SupportTicketSystem from "@/components/SupportTicketSystem";
import { MessagingTerminal } from "@/components/messaging/MessagingTerminal";
import CampusFeed from "@/components/CampusFeed";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const config = dashboardConfigs.admin;

  const { data: realStats } = useQuery({
    queryKey: ["dashboard-stats", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) return null;
      return data;
    },
  });

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  const displayStats = config.stats.map(stat => {
    if (!realStats) return stat;
    let newValue = stat.value;
    if (stat.title === "Total Users") newValue = (realStats as any).total_users;
    if (stat.title === "Platform Revenue") newValue = (realStats as any).platform_revenue;
    if (stat.title === "Pending Approvals") newValue = (realStats as any).pending_approvals;
    if (stat.title === "Active Orders") newValue = (realStats as any).active_orders;
    return { ...stat, value: newValue };
  });

  const navItems = config.navItems.map((item) => ({
    ...item,
    active: item.label === activeNav,
    onClick: () => setActiveNav(item.label),
  }));

  const renderContent = () => {
    if (activeNav === "Messages") return <MessagingTerminal />;
    if (activeNav === "Campus Feed") return <CampusFeed />;
    if (activeNav === "Approve Vendors") return <AdminApprovals filterRole="vendor" />;
    if (activeNav === "Approve Farmers") return <AdminApprovals filterRole="farmer" />;
    if (activeNav === "Verify Riders") return <AdminApprovals filterRole="rider" />;
    if (activeNav === "Monitor Orders") return <OrdersList viewAs="vendor" />;
    if (activeNav === "Analytics") return <AnalyticsDashboard />;
    if (activeNav === "Support Tickets") return <SupportTicketSystem viewAs="admin" />;
    if (activeNav === "Disputes") return <SupportTicketSystem viewAs="admin" />;
    if (activeNav === "Payouts") return <AdvancedAnalytics />;
    if (activeNav === "Settings") return <AdminSettings />;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {displayStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
        <div className="mb-8"><AdminApprovals /></div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar items={navItems} role="Admin" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
           <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">System Overview</p>
            </div>
            <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>Log Out</Button>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
