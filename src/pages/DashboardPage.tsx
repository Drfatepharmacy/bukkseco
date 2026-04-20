import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatCard from "@/components/StatCard";
import InteractiveChart from "@/components/InteractiveChart";
import FoodHero from "@/components/FoodHero";
import AdminApprovals from "@/components/AdminApprovals";
import SupportButton from "@/components/SupportButton";
import VendorMenuManager from "@/components/VendorMenuManager";
import BrowseFood from "@/components/BrowseFood";
import GroupBuySection from "@/components/GroupBuySection";
import OrdersList from "@/components/OrdersList";
import HealthTipsLive from "@/components/HealthTipsLive";
import RiderDeliverySystem from "@/components/RiderDeliverySystem";
import TableReservation from "@/components/TableReservation";
import { MessagingTerminal } from "@/components/messaging/MessagingTerminal";
import FounderConsolePage from "./FounderConsolePage";
import { VendorReviews } from "@/components/VendorReviews";
import { AdminSettings } from "@/components/AdminSettings";
import FarmerStockManager from "@/components/FarmerStockManager";
import CampusFeed from "@/components/CampusFeed";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import RiderMapView from "@/components/RiderMapView";
import LiveRiderTracking from "@/components/LiveRiderTracking";
import SupportTicketSystem from "@/components/SupportTicketSystem";
import ProfileSettings from "@/components/ProfileSettings";
import { dashboardConfigs } from "@/config/dashboardConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DashboardPage = () => {
  const { role: rawRole } = useParams<{ role: string }>();
  const role = rawRole === "student" ? "student" : rawRole;
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  const config = dashboardConfigs[role || ""];

  const { data: realStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", role, user?.id],
    queryFn: async () => {
      if (!user) return null;
      let rpcName = "";
      if (role === "student") rpcName = "get_student_stats";
      else if (role === "vendor") rpcName = "get_vendor_stats";
      else if (role === "rider") rpcName = "get_rider_stats";
      else if (role === "admin" || role === "super_admin") rpcName = "get_admin_stats";
      else if (role === "farmer") rpcName = "get_vendor_stats"; // Farmers use vendor stats logic for now

      if (!rpcName) return null;

      const { data, error } = await (rpcName === "get_admin_stats"
        ? supabase.rpc(rpcName as any)
        : supabase.rpc(rpcName as any, { _user_id: user.id }));

      if (error) {
        console.error("Error fetching stats:", error);
        return null;
      }
      return data;
    },
    enabled: !!user && !!role,
  });

  const { data: chartData } = useQuery({
    queryKey: ["dashboard-charts", role, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: orders } = await supabase.rpc("get_order_chart_data", {
        _user_id: user.id,
        _role: role
      } as any);
      const { data: revenue } = await supabase.rpc("get_revenue_chart_data", {
        _user_id: user.id,
        _role: role
      } as any);
      return { orders, revenue };
    },
    enabled: !!user && !!role,
  });

  if (!config) {
    navigate("/");
    return null;
  }

  // Map real stats to config structure
  // Map real charts to config structure
  const displayCharts = config.charts.map(chart => {
    if (!chartData) return chart;
    if (chart.title.toLowerCase().includes("order") || chart.title.toLowerCase().includes("produce sales") || chart.title.toLowerCase().includes("deliveries")) {
      return { ...chart, data: (chartData as any).orders || chart.data };
    }
    if (chart.title.toLowerCase().includes("revenue") || chart.title.toLowerCase().includes("spending") || chart.title.toLowerCase().includes("earnings")) {
      return { ...chart, data: (chartData as any).revenue || chart.data };
    }
    return chart;
  });

  const displayStats = config.stats.map(stat => {
    if (!realStats) return stat;

    let newValue = stat.value;
    if (role === "student") {
      if (stat.title === "Orders This Month") newValue = (realStats as any).orders_this_month;
      if (stat.title === "Active Deliveries") newValue = (realStats as any).active_deliveries;
      if (stat.title === "Average Rating") newValue = (realStats as any).avg_rating;
      if (stat.title === "Savings") newValue = (realStats as any).total_savings;
    } else if (role === "vendor" || role === "farmer") {
      if (stat.title === "Total Revenue" || stat.title === "Revenue") newValue = (realStats as any).total_revenue;
      if (stat.title === "Active Orders") newValue = (realStats as any).active_orders;
      if (stat.title === "Menu Items" || stat.title === "Active Stock") newValue = (realStats as any).menu_items;
      if (stat.title === "Customer Rating") newValue = (realStats as any).avg_rating;
    } else if (role === "rider") {
      if (stat.title === "Earnings Today") newValue = (realStats as any).earnings_today;
      if (stat.title === "Deliveries Today") newValue = (realStats as any).deliveries_today;
      if (stat.title === "Active Delivery") newValue = (realStats as any).active_delivery_id ? 1 : 0;
      if (stat.title === "Rating") newValue = (realStats as any).avg_rating;
    } else if (role === "admin" || role === "super_admin") {
      if (stat.title === "Total Users") newValue = (realStats as any).total_users;
      if (stat.title === "Platform Revenue") newValue = (realStats as any).platform_revenue;
      if (stat.title === "Pending Approvals") newValue = (realStats as any).pending_approvals;
      if (stat.title === "Active Orders") newValue = (realStats as any).active_orders;
    }

    return { ...stat, value: newValue };
  });

  const navItems = config.navItems.map((item) => ({
    ...item,
    active: item.label === activeNav,
    onClick: () => setActiveNav(item.label),
  }));

  const renderContent = () => {
    if (activeNav === "Founder Console") return <FounderConsolePage />;

    // Shared: Messages, Campus Feed
    if (activeNav === "Messages") return <MessagingTerminal />;
    if (activeNav === "Campus Feed") return <CampusFeed />;

    // Vendor
    if (role === "vendor" && activeNav === "Manage Menu") return <VendorMenuManager />;
    if (role === "vendor" && activeNav === "Orders") return <OrdersList viewAs="vendor" />;
    if (role === "vendor" && activeNav === "Reviews") return <VendorReviews vendorId={user?.id || ""} />;
    if (role === "vendor" && activeNav === "Reservations") return <TableReservation />;

    // Buyer
    if (role === "student" && activeNav === "Browse Food") return <BrowseFood />;
    if (role === "student" && activeNav === "My Orders") return <OrdersList viewAs="user" />;
    if (role === "student" && activeNav === "Farm Produce") return <GroupBuySection />;
    if (role === "student" && activeNav === "Reservations") return <TableReservation />;

    // Rider
    if (role === "rider" && activeNav === "Available Deliveries") return <RiderDeliverySystem />;
    if (role === "rider" && activeNav === "Browse Food") return <BrowseFood />;
    if (role === "rider" && activeNav === "Navigation") return <LiveRiderTracking />;

    // Farmer
    if (role === "farmer" && activeNav === "Upload Produce") return <FarmerStockManager />;

    // Admin
    if ((role === "admin" || role === "super_admin") && activeNav === "Approve Vendors") return <AdminApprovals filterRole="vendor" />;
    if ((role === "admin" || role === "super_admin") && activeNav === "Approve Farmers") return <AdminApprovals filterRole="farmer" />;
    if ((role === "admin" || role === "super_admin") && activeNav === "Verify Riders") return <AdminApprovals filterRole="rider" />;
    if ((role === "admin" || role === "super_admin") && activeNav === "Monitor Orders") return <OrdersList viewAs="vendor" />;
    if ((role === "admin" || role === "super_admin") && activeNav === "Analytics") return <AnalyticsDashboard />;
    if ((role === "admin" || role === "super_admin") && activeNav === "Support Tickets") return <SupportTicketSystem viewAs="admin" />;

    // Support tickets for all roles
    if (activeNav === "Support") return <SupportTicketSystem viewAs="user" />;

    // Settings for all roles
    if (activeNav === "Settings") {
      if (role === "admin" || role === "super_admin") return <AdminSettings />;
      return <ProfileSettings role={role} />;
    }

    // Track Delivery (student) - show rider map
    if (activeNav === "Track Delivery") return <LiveRiderTracking />;

    // Revenue / Earnings - show analytics
    if (activeNav === "Revenue" || activeNav === "Earnings") return <AdvancedAnalytics />;

    // Delivery History for riders
    if (activeNav === "Delivery History") return <OrdersList viewAs="vendor" />;

    // Manage Stock for farmers
    if (activeNav === "Manage Stock") return <FarmerStockManager />;

    // Delivery Schedule for farmers
    if (activeNav === "Delivery Schedule") return <RiderDeliverySystem />;

    // Disputes for admin
    if (activeNav === "Disputes") return <SupportTicketSystem viewAs="admin" />;

    // Payouts for admin
    if (activeNav === "Payouts") return <AdvancedAnalytics />;

    // Default: Overview
    return (
      <>
        {role === "student" && <FoodHero />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {displayStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {(role === "admin" || role === "super_admin") && <div className="mb-8"><AdminApprovals /></div>}

        {/* Health Tips on student overview */}
        {role === "student" && <div className="mb-8"><HealthTipsLive /></div>}

        {/* Group Buy preview on student overview */}
        {role === "student" && <div className="mb-8"><GroupBuySection /></div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {displayCharts.map((chart, i) => (
            <InteractiveChart key={i} {...chart} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { text: "New order #1247 received", time: "2 min ago", status: "active" },
              { text: "Payment of ₦3,500 processed", time: "15 min ago", status: "success" },
              { text: "Delivery completed for order #1245", time: "1 hour ago", status: "done" },
              { text: "New review received - 5 stars", time: "3 hours ago", status: "info" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === "active" ? "bg-primary animate-pulse" :
                    item.status === "success" ? "bg-success" :
                    "bg-muted-foreground"
                  }`} />
                  <span className="text-sm font-body text-foreground">{item.text}</span>
                </div>
                <span className="text-xs text-muted-foreground font-body">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar
        items={navItems}
        role={config.label}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{config.label}</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">
                {user?.email ? `Welcome, ${user.user_metadata?.full_name || user.email}` : "Welcome back!"}
              </p>
            </div>
            <Button variant="outline" onClick={() => { signOut(); navigate("/"); }} className="font-body text-sm">
              Log Out
            </Button>
          </motion.div>

          {renderContent()}
        </div>
      </main>
      <SupportButton />
    </div>
  );
};

export default DashboardPage;
