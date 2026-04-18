import { dashboardConfigs } from "@/config/dashboardConfig";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/StatCard";
import InteractiveChart from "@/components/InteractiveChart";
import DashboardSidebar from "@/components/DashboardSidebar";
import FarmerStockManager from "@/components/FarmerStockManager";
import { MessagingTerminal } from "@/components/messaging/MessagingTerminal";
import SupportTicketSystem from "@/components/SupportTicketSystem";
import ProfileSettings from "@/components/ProfileSettings";
import RiderDeliverySystem from "@/components/RiderDeliverySystem";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FarmerDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const config = dashboardConfigs.farmer;

  const { data: realStats } = useQuery({
    queryKey: ["dashboard-stats", "farmer", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_farmer_stats", { _user_id: user.id });
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const { data: chartData } = useQuery({
    queryKey: ["dashboard-charts", "farmer", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: orders } = await supabase.rpc("get_order_chart_data", { _user_id: user.id, _role: "farmer" } as any);
      const { data: revenue } = await supabase.rpc("get_revenue_chart_data", { _user_id: user.id, _role: "farmer" } as any);
      return { orders, revenue };
    },
    enabled: !!user,
  });

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  const displayStats = config.stats.map(stat => {
    if (!realStats) return stat;
    let newValue = stat.value;
    if (stat.title === "Revenue") newValue = (realStats as any).total_revenue;
    if (stat.title === "Active Stock") newValue = (realStats as any).menu_items;
    if (stat.title === "Bulk Orders") newValue = (realStats as any).active_orders;
    return { ...stat, value: newValue };
  });

  const displayCharts = config.charts.map(chart => {
    if (!chartData) return chart;
    if (chart.title.toLowerCase().includes("produce sales")) return { ...chart, data: (chartData as any).orders || chart.data };
    if (chart.title.toLowerCase().includes("revenue trend")) return { ...chart, data: (chartData as any).revenue || chart.data };
    return chart;
  });

  const navItems = config.navItems.map((item) => ({
    ...item,
    active: item.label === activeNav,
    onClick: () => setActiveNav(item.label),
  }));

  const renderContent = () => {
    if (activeNav === "Messages") return <MessagingTerminal />;
    if (activeNav === "Upload Produce") return <FarmerStockManager />;
    if (activeNav === "Manage Stock") return <FarmerStockManager />;
    if (activeNav === "Delivery Schedule") return <RiderDeliverySystem />;
    if (activeNav === "Revenue") return <AdvancedAnalytics />;
    if (activeNav === "Support") return <SupportTicketSystem viewAs="user" />;
    if (activeNav === "Settings") return <ProfileSettings role="farmer" />;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {displayStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {displayCharts.map((chart, i) => (
            <InteractiveChart key={i} {...chart} />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar items={navItems} role="Farmer" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
           <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Farmer Dashboard</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Agricultural Portal</p>
            </div>
            <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>Log Out</Button>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default FarmerDashboard;
