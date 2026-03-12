import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, Truck, Wallet, Star, Clock,
  Package, BarChart3, Settings, Users, CheckCircle, AlertTriangle,
  Utensils, Sprout, MapPin, History, TrendingUp, Bike
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import StatCard from "@/components/StatCard";
import InteractiveChart from "@/components/InteractiveChart";
import FoodHero from "@/components/FoodHero";
import AdminApprovals from "@/components/AdminApprovals";
import { dashboardConfigs } from "@/config/dashboardConfig";

const DashboardPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  const config = dashboardConfigs[role || ""];
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
            className="mb-8"
          >
            <h1 className="font-display text-3xl font-bold text-foreground">{config.label}</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">Welcome back! Here's your overview.</p>
          </motion.div>

          {/* Student food hero */}
          {role === "student" && <FoodHero />}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {config.stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>

          {/* Admin approvals */}
          {role === "admin" && activeNav === "Overview" && (
            <div className="mb-8">
              <AdminApprovals />
            </div>
          )}

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
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
