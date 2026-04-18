import { dashboardConfigs } from "@/config/dashboardConfig";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/StatCard";
import InteractiveChart from "@/components/InteractiveChart";
import DashboardSidebar from "@/components/DashboardSidebar";
import FoodHero from "@/components/FoodHero";
import HealthTipsLive from "@/components/HealthTipsLive";
import GroupBuySection from "@/components/GroupBuySection";
import BrowseFood from "@/components/BrowseFood";
import OrdersList from "@/components/OrdersList";
import TableReservation from "@/components/TableReservation";
import CampusFeed from "@/components/CampusFeed";
import { MessagingTerminal } from "@/components/messaging/MessagingTerminal";
import SupportTicketSystem from "@/components/SupportTicketSystem";
import ProfileSettings from "@/components/ProfileSettings";
import LiveRiderTracking from "@/components/LiveRiderTracking";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const config = dashboardConfigs.student;

  const { data: realStats } = useQuery({
    queryKey: ["dashboard-stats", "student", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_student_stats", { _user_id: user.id });
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const { data: chartData } = useQuery({
    queryKey: ["dashboard-charts", "student", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: orders } = await supabase.rpc("get_order_chart_data", { _user_id: user.id, _role: "student" } as any);
      const { data: revenue } = await supabase.rpc("get_revenue_chart_data", { _user_id: user.id, _role: "student" } as any);
      return { orders, revenue };
    },
    enabled: !!user,
  });

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  const displayStats = config.stats.map(stat => {
    if (!realStats) return stat;
    let newValue = stat.value;
    if (stat.title === "Orders This Month") newValue = (realStats as any).orders_this_month;
    if (stat.title === "Active Deliveries") newValue = (realStats as any).active_deliveries;
    if (stat.title === "Average Rating") newValue = (realStats as any).avg_rating;
    if (stat.title === "Savings") newValue = (realStats as any).total_savings;
    return { ...stat, value: newValue };
  });

  const displayCharts = config.charts.map(chart => {
    if (!chartData) return chart;
    if (chart.title.toLowerCase().includes("order")) return { ...chart, data: (chartData as any).orders || chart.data };
    if (chart.title.toLowerCase().includes("spending")) return { ...chart, data: (chartData as any).revenue || chart.data };
    return chart;
  });

  const navItems = config.navItems.map((item) => ({
    ...item,
    active: item.label === activeNav,
    onClick: () => setActiveNav(item.label),
  }));

  const renderContent = () => {
    if (activeNav === "Messages") return <MessagingTerminal />;
    if (activeNav === "Campus Feed") return <CampusFeed />;
    if (activeNav === "Browse Food") return <BrowseFood />;
    if (activeNav === "My Orders") return <OrdersList viewAs="buyer" />;
    if (activeNav === "Farm Produce") return <GroupBuySection />;
    if (activeNav === "Reservations") return <TableReservation />;
    if (activeNav === "Track Delivery") return <LiveRiderTracking />;
    if (activeNav === "Support") return <SupportTicketSystem viewAs="user" />;
    if (activeNav === "Settings") return <ProfileSettings role="student" />;

    return (
      <>
        <FoodHero />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {displayStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
        <div className="mb-8"><HealthTipsLive /></div>
        <div className="mb-8"><GroupBuySection /></div>
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
      <DashboardSidebar items={navItems} role="Student" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Student Dashboard</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Welcome back, {user?.email}</p>
            </div>
            <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>Log Out</Button>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
