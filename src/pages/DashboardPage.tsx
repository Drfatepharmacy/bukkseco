import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, Truck, Wallet, Star, Clock,
  Package, BarChart3, Settings, Users, CheckCircle, AlertTriangle,
  Utensils, Sprout, MapPin, History, TrendingUp, Menu
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatCard from "@/components/StatCard";
import InteractiveChart from "@/components/InteractiveChart";

const weeklyData = [
  { label: "Mon", value: 120 },
  { label: "Tue", value: 180 },
  { label: "Wed", value: 95 },
  { label: "Thu", value: 220 },
  { label: "Fri", value: 310 },
  { label: "Sat", value: 260 },
  { label: "Sun", value: 150 },
];

const monthlyRevenue = [
  { label: "Jan", value: 4500 },
  { label: "Feb", value: 5200 },
  { label: "Mar", value: 6100 },
  { label: "Apr", value: 4800 },
  { label: "May", value: 7300 },
  { label: "Jun", value: 8900 },
];

const roleConfigs: Record<string, {
  label: string;
  stats: { title: string; value: number; prefix?: string; suffix?: string; icon: any; trend?: number; color?: "primary" | "secondary" | "success" }[];
  navItems: { label: string; icon: any }[];
  charts: { title: string; data: { label: string; value: number }[]; color?: "primary" | "secondary" | "success" }[];
}> = {
  student: {
    label: "Student Dashboard",
    stats: [
      { title: "Orders This Month", value: 23, icon: ShoppingBag, trend: 12, color: "primary" },
      { title: "Wallet Balance", value: 15400, prefix: "₦", icon: Wallet, color: "success" },
      { title: "Active Deliveries", value: 2, icon: Truck, trend: 5, color: "secondary" },
      { title: "Average Rating", value: 4, suffix: ".8", icon: Star, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Browse Food", icon: Utensils },
      { label: "Farm Produce", icon: Sprout },
      { label: "My Orders", icon: ShoppingBag },
      { label: "Track Delivery", icon: Truck },
      { label: "Wallet", icon: Wallet },
      { label: "Order History", icon: Clock },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Orders This Week", data: weeklyData, color: "primary" },
      { title: "Spending Trend", data: monthlyRevenue, color: "secondary" },
    ],
  },
  vendor: {
    label: "Vendor Dashboard",
    stats: [
      { title: "Total Revenue", value: 342500, prefix: "₦", icon: TrendingUp, trend: 18, color: "success" },
      { title: "Active Orders", value: 8, icon: Package, trend: 3, color: "primary" },
      { title: "Menu Items", value: 24, icon: Utensils, color: "secondary" },
      { title: "Customer Rating", value: 4, suffix: ".6", icon: Star, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Manage Menu", icon: Utensils },
      { label: "Orders", icon: Package },
      { label: "Revenue", icon: TrendingUp },
      { label: "Analytics", icon: BarChart3 },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Orders This Week", data: weeklyData, color: "primary" },
      { title: "Monthly Revenue", data: monthlyRevenue, color: "success" },
    ],
  },
  farmer: {
    label: "Farmer Dashboard",
    stats: [
      { title: "Revenue", value: 187000, prefix: "₦", icon: TrendingUp, trend: 22, color: "success" },
      { title: "Active Stock", value: 42, icon: Sprout, color: "primary" },
      { title: "Bulk Orders", value: 6, icon: Package, trend: 8, color: "secondary" },
      { title: "Deliveries Scheduled", value: 3, icon: Truck, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Upload Produce", icon: Sprout },
      { label: "Manage Stock", icon: Package },
      { label: "Bulk Orders", icon: ShoppingBag },
      { label: "Delivery Schedule", icon: Truck },
      { label: "Revenue", icon: TrendingUp },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Produce Sales", data: weeklyData, color: "success" },
      { title: "Revenue Trend", data: monthlyRevenue, color: "primary" },
    ],
  },
  rider: {
    label: "Rider Dashboard",
    stats: [
      { title: "Earnings Today", value: 4200, prefix: "₦", icon: Wallet, trend: 15, color: "success" },
      { title: "Deliveries Today", value: 12, icon: Truck, trend: 8, color: "primary" },
      { title: "Active Delivery", value: 1, icon: MapPin, color: "secondary" },
      { title: "Rating", value: 4, suffix: ".9", icon: Star, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Available Deliveries", icon: Package },
      { label: "Navigation", icon: MapPin },
      { label: "Earnings", icon: Wallet },
      { label: "Delivery History", icon: History },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Deliveries This Week", data: weeklyData, color: "secondary" },
      { title: "Earnings Trend", data: monthlyRevenue, color: "success" },
    ],
  },
  admin: {
    label: "Admin Panel",
    stats: [
      { title: "Total Users", value: 2847, icon: Users, trend: 14, color: "primary" },
      { title: "Platform Revenue", value: 1250000, prefix: "₦", icon: TrendingUp, trend: 22, color: "success" },
      { title: "Pending Approvals", value: 15, icon: AlertTriangle, color: "secondary" },
      { title: "Active Orders", value: 89, icon: Package, trend: 7, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Approve Vendors", icon: CheckCircle },
      { label: "Approve Farmers", icon: Sprout },
      { label: "Verify Riders", icon: Bike },
      { label: "Monitor Orders", icon: Package },
      { label: "Analytics", icon: BarChart3 },
      { label: "Disputes", icon: AlertTriangle },
      { label: "Payouts", icon: Wallet },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Platform Orders", data: weeklyData, color: "primary" },
      { title: "Revenue Growth", data: monthlyRevenue, color: "success" },
    ],
  },
};

// Import Bike separately since it's used in admin navItems
import { Bike } from "lucide-react";

const DashboardPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  const config = roleConfigs[role || ""];
  if (!config) {
    navigate("/");
    return null;
  }

  const navItems = config.navItems.map((item) => ({
    ...item,
    active: item.label === activeNav,
    onClick: () => setActiveNav(item.label),
  }));

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        items={navItems}
        role={config.label}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl font-bold text-foreground">{config.label}</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">Welcome back! Here's your overview.</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {config.stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {config.charts.map((chart, i) => (
              <InteractiveChart key={i} {...chart} />
            ))}
          </div>

          {/* Recent Activity */}
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
                  className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
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
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
