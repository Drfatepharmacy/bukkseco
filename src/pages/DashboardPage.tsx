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
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DashboardPageProps {
  role?: string;
}

const DashboardPage = ({ role: propsRole }: DashboardPageProps) => {
  const { role: paramRole } = useParams<{ role: string }>();
  const rawRole = propsRole || paramRole;
  const role = rawRole === "student" ? "student" : rawRole;
  const navigate = useNavigate();
  const { signOut, user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  const config = dashboardConfigs[role || ""];

  const { data: realStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboard-stats", role, user?.id],
    queryFn: async () => {
      try {
        if (!user) return null;
        let rpcName = "";
        if (role === "student") rpcName = "get_student_stats";
        else if (role === "vendor") rpcName = "get_vendor_stats";
        else if (role === "rider") rpcName = "get_rider_stats";
        else if (role === "admin") rpcName = "get_admin_stats";
        else if (role === "farmer") rpcName = "get_vendor_stats";

        if (!rpcName) return null;

        const { data, error } = await (rpcName === "get_admin_stats"
          ? supabase.rpc(rpcName as any)
          : supabase.rpc(rpcName as any, { _user_id: user.id }));

        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Error in dashboard stats query:", err);
        throw err;
      }
    },
    enabled: !!user && !!role,
    retry: 1
  });

  const { data: chartData, error: chartsError } = useQuery({
    queryKey: ["dashboard-charts", role, user?.id],
    queryFn: async () => {
      // Chart RPCs not yet provisioned — return empty arrays so the UI degrades gracefully.
      return { orders: [] as any[], revenue: [] as any[] };
    },
    enabled: !!user && !!role,
    retry: 0,
  });
      }
    },
    enabled: !!user && !!role,
    retry: 1
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="font-body text-muted-foreground">Initializing dashboard...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    console.warn(`No config found for role: ${role}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            We couldn't load the dashboard for your role ({role}).
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="mt-4 w-full">
              Return Home
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
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
    } else if (role === "admin") {
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
    if (role === "student" && activeNav === "My Orders") return <OrdersList viewAs="buyer" />;
    if (role === "student" && activeNav === "Farm Produce") return <GroupBuySection />;
    if (role === "student" && activeNav === "Reservations") return <TableReservation />;

    // Rider
    if (role === "rider" && activeNav === "Available Deliveries") return <RiderDeliverySystem />;
    if (role === "rider" && activeNav === "Browse Food") return <BrowseFood />;
    if (role === "rider" && activeNav === "Navigation") return <LiveRiderTracking />;

    // Farmer
    if (role === "farmer" && activeNav === "Upload Produce") return <FarmerStockManager />;

    // Admin
    if (role === "admin" && activeNav === "Approve Vendors") return <AdminApprovals filterRole="vendor" />;
    if (role === "admin" && activeNav === "Approve Farmers") return <AdminApprovals filterRole="farmer" />;
    if (role === "admin" && activeNav === "Verify Riders") return <AdminApprovals filterRole="rider" />;
    if (role === "admin" && activeNav === "Monitor Orders") return <OrdersList viewAs="vendor" />;
    if (role === "admin" && activeNav === "Analytics") return <AnalyticsDashboard />;
    if (role === "admin" && activeNav === "Support Tickets") return <SupportTicketSystem viewAs="admin" />;

    // Support tickets for all roles
    if (activeNav === "Support") return <SupportTicketSystem viewAs="user" />;

    // Settings for all roles
    if (activeNav === "Settings") {
      if (role === "admin") return <AdminSettings />;
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
        {user?.email === "ilomuche@gmail.com" && (
          <div className="mb-8 p-4 bg-black text-green-500 rounded-lg font-mono text-xs overflow-auto max-h-60 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <div className="flex justify-between items-center mb-2 border-b border-green-500/30 pb-2">
              <span className="font-bold text-sm uppercase tracking-wider">System Debug Terminal [v1.0.4]</span>
              <span className="px-2 py-0.5 bg-green-500 text-black text-[10px] font-bold rounded">LIVE</span>
            </div>
            <div className="space-y-1">
              <p><span className="text-gray-500">[{new Date().toISOString()}]</span> SESSION_STATUS: <span className="text-white">ACTIVE</span></p>
              <p><span className="text-gray-500">[{new Date().toISOString()}]</span> USER_ID: <span className="text-white">{user?.id}</span></p>
              <p><span className="text-gray-500">[{new Date().toISOString()}]</span> ROLE_DETECTED: <span className="text-white">{role}</span></p>
              <p><span className="text-gray-500">[{new Date().toISOString()}]</span> CONFIG_LOADED: <span className={config ? "text-green-400" : "text-red-400"}>{config ? "YES" : "NO"}</span></p>
              <p><span className="text-gray-500">[{new Date().toISOString()}]</span> STATS_QUERY: <span className={statsLoading ? "text-yellow-400" : statsError ? "text-red-400" : "text-green-400"}>{statsLoading ? "LOADING" : statsError ? `ERROR: ${(statsError as any).message}` : "SUCCESS"}</span></p>
              <p><span className="text-gray-500">[{new Date().toISOString()}]</span> CHARTS_QUERY: <span className={chartsError ? "text-red-400" : "text-green-400"}>{chartsError ? `ERROR: ${(chartsError as any).message}` : "SUCCESS"}</span></p>
              <details className="mt-2 cursor-pointer">
                <summary className="text-blue-400 hover:text-blue-300 transition-colors">RAW_SESSION_DATA</summary>
                <pre className="mt-1 p-2 bg-gray-900 rounded border border-gray-800 text-[10px] text-gray-300">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {role === "student" && <FoodHero />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {displayStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {role === "admin" && <div className="mb-8"><AdminApprovals /></div>}

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
