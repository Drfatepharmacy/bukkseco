import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, TrendingUp, Package, Truck, MessageCircle, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import InteractiveChart from "@/components/InteractiveChart";

interface KPI {
  label: string;
  value: number;
  prefix?: string;
  icon: any;
  change?: string;
  color: "primary" | "secondary" | "success";
}

const AdvancedAnalytics = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [ordersByDay, setOrdersByDay] = useState<{ label: string; value: number }[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<{ label: string; value: number }[]>([]);
  const [usersByRole, setUsersByRole] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);

    // Fetch counts in parallel
    const [
      { count: totalUsers },
      { count: totalOrders },
      { count: totalVendors },
      { count: totalRiders },
      { count: totalFarmers },
      { count: pendingApprovals },
      { count: activeDeliveries },
      { count: totalMessages },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("vendor_profiles").select("*", { count: "exact", head: true }),
      supabase.from("rider_profiles").select("*", { count: "exact", head: true }),
      supabase.from("farmer_profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_approved", false),
      supabase.from("delivery_assignments").select("*", { count: "exact", head: true }).in("status", ["searching", "offered", "accepted", "picked_up"]),
      supabase.from("chat_messages").select("*", { count: "exact", head: true }),
    ]);

    // Revenue
    const { data: orders } = await supabase.from("orders").select("total_amount, created_at, status");
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    setKpis([
      { label: "Total Users", value: totalUsers || 0, icon: Users, color: "primary" },
      { label: "Platform Revenue", value: totalRevenue, prefix: "₦", icon: TrendingUp, color: "success" },
      { label: "Total Orders", value: totalOrders || 0, icon: Package, color: "secondary" },
      { label: "Active Deliveries", value: activeDeliveries || 0, icon: Truck, color: "primary" },
      { label: "Pending Approvals", value: pendingApprovals || 0, icon: Activity, color: "secondary" },
      { label: "Chat Messages", value: totalMessages || 0, icon: MessageCircle, color: "primary" },
    ]);

    setUsersByRole([
      { label: "Vendors", value: totalVendors || 0 },
      { label: "Riders", value: totalRiders || 0 },
      { label: "Farmers", value: totalFarmers || 0 },
      { label: "Buyers", value: (totalUsers || 0) - (totalVendors || 0) - (totalRiders || 0) - (totalFarmers || 0) },
    ]);

    // Orders by day of week
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts = Array(7).fill(0);
    orders?.forEach((o) => {
      const d = new Date(o.created_at).getDay();
      dayCounts[d]++;
    });
    setOrdersByDay(days.map((d, i) => ({ label: d, value: dayCounts[i] })));

    // Revenue by month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthRevenue = Array(12).fill(0);
    orders?.forEach((o) => {
      const m = new Date(o.created_at).getMonth();
      monthRevenue[m] += Number(o.total_amount);
    });
    setRevenueByMonth(monthNames.map((m, i) => ({ label: m, value: Math.round(monthRevenue[i]) })));

    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Platform Analytics</h2>
        <Button variant="outline" size="sm" onClick={loadAnalytics} className="font-body text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                kpi.color === "primary" ? "bg-primary/10" :
                kpi.color === "success" ? "bg-success/10" : "bg-secondary/10"
              }`}>
                <kpi.icon className={`w-4 h-4 ${
                  kpi.color === "primary" ? "text-primary" :
                  kpi.color === "success" ? "text-success" : "text-secondary"
                }`} />
              </div>
              <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              {kpi.prefix}{kpi.value.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InteractiveChart title="Orders by Day" data={ordersByDay} color="primary" />
        <InteractiveChart title="Revenue by Month (₦)" data={revenueByMonth} color="success" />
      </div>

      {/* Users by Role */}
      <div className="glass-card p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Users by Role</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {usersByRole.map((role, i) => (
            <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-display font-bold text-foreground">{role.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{role.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
