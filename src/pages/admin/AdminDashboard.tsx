import { dashboardConfigs } from "@/config/dashboardConfig";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/StatCard";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const config = dashboardConfigs.admin;

  const navItems = config.navItems.map((item) => ({
    ...item,
    active: item.label === "Overview",
    onClick: () => {
        if (item.label === "Approve Vendors") navigate("/admin/vendors");
        else if (item.label === "Monitor Orders") navigate("/admin/orders");
    },
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar
        items={navItems}
        role="Admin"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
           <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">
                System Overview
              </p>
            </div>
            <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>Log Out</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {config.stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
