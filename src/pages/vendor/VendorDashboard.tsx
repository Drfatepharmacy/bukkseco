import { dashboardConfigs } from "@/config/dashboardConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import InteractiveChart from "@/components/InteractiveChart";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const VendorDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const config = dashboardConfigs.vendor;

  const navItems = config.navItems.map((item) => ({
    ...item,
    active: item.label === "Overview",
    onClick: () => {
        if (item.label === "Manage Menu") navigate("/vendor/menu");
        else if (item.label === "Orders") navigate("/vendor/orders");
        else if (item.label === "Revenue") navigate("/vendor/sales");
    },
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar
        items={navItems}
        role="Vendor"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
           <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Vendor Dashboard</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">
                Welcome back, {user?.user_metadata?.full_name || "Vendor"}
              </p>
            </div>
            <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>Log Out</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {config.stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {config.charts.map((chart, i) => (
              <InteractiveChart key={i} {...chart} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3">
                {[
                  { text: "New order #1247 received", time: "2 min ago", status: "active" },
                  { text: "Payment of ₦3,500 processed", time: "15 min ago", status: "success" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm font-body text-foreground">{item.text}</span>
                    <span className="text-xs text-muted-foreground font-body">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
