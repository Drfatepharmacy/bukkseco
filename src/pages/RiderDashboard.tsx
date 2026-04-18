import { dashboardConfigs } from "@/config/dashboardConfig";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/StatCard";
import InteractiveChart from "@/components/InteractiveChart";
import DashboardSidebar from "@/components/DashboardSidebar";
import RiderDeliverySystem from "@/components/RiderDeliverySystem";
import BrowseFood from "@/components/BrowseFood";
import LiveRiderTracking from "@/components/LiveRiderTracking";
import OrdersList from "@/components/OrdersList";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import { MessagingTerminal } from "@/components/messaging/MessagingTerminal";
import SupportTicketSystem from "@/components/SupportTicketSystem";
import ProfileSettings from "@/components/ProfileSettings";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const RiderDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const config = dashboardConfigs.rider;

  const { data: realStats } = useQuery({
    queryKey: ["dashboard-stats", "rider", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_rider_stats", { _user_id: user.id });
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const { data: chartData } = useQuery({
    queryKey: ["dashboard-charts", "rider", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: orders } = await supabase.rpc("get_order_chart_data", { _user_id: user.id, _role: "rider" } as any);
      const { data: revenue } = await supabase.rpc("get_revenue_chart_data", { _user_id: user.id, _role: "rider" } as any);
      return { orders, revenue };
    },
    enabled: !!user,
  });

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  const displayStats = config.stats.map(stat => {
    if (!realStats) return stat;
    let newValue = stat.value;
    if (stat.title === "Earnings Today") newValue = (realStats as any).earnings_today;
    if (stat.title === "Deliveries Today") newValue = (realStats as any).deliveries_today;
    if (stat.title === "Active Delivery") newValue = (realStats as any).active_delivery_id ? 1 : 0;
    return { ...stat, value: newValue };
  });

  const displayCharts = config.charts.map(chart => {
    if (!chartData) return chart;
    if (chart.title.toLowerCase().includes("deliveries")) return { ...chart, data: (chartData as any).orders || chart.data };
    if (chart.title.toLowerCase().includes("earnings")) return { ...chart, data: (chartData as any).revenue || chart.data };
    return chart;
  });

  const navItems = config.navItems.map((item) => ({
    ...item,
    active: item.label === activeNav,
    onClick: () => setActiveNav(item.label),
  }));

  const renderContent = () => {
    if (activeNav === "Messages") return <MessagingTerminal />;
    if (activeNav === "Available Deliveries") return <RiderDeliverySystem />;
    if (activeNav === "Browse Food") return <BrowseFood />;
    if (activeNav === "Navigation") return <LiveRiderTracking />;
    if (activeNav === "Earnings") return <AdvancedAnalytics />;
    if (activeNav === "Delivery History") return <OrdersList viewAs="vendor" />;
    if (activeNav === "Support") return <SupportTicketSystem viewAs="user" />;
    if (activeNav === "Settings") return <ProfileSettings role="rider" />;

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
      <DashboardSidebar items={navItems} role="Rider" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
           <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Rider Dashboard</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Delivery Partner Portal</p>
            </div>
            <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>Log Out</Button>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default RiderDashboard;
