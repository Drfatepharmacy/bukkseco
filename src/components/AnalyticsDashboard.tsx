import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Users, TrendingUp, Package, Truck, Clock, AlertTriangle,
  RefreshCw, ChefHat, Star, ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

const COLORS = ["hsl(43,96%,56%)", "hsl(270,50%,40%)", "hsl(160,84%,39%)", "hsl(0,84%,60%)", "hsl(200,80%,50%)"];

interface AnalyticsData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeDeliveries: number;
  pendingApprovals: number;
  avgDeliveryTime: number;
  ordersByDay: { name: string; orders: number }[];
  revenueByMonth: { name: string; revenue: number }[];
  usersByRole: { name: string; value: number }[];
  ordersByStatus: { name: string; value: number }[];
  peakHours: { hour: string; orders: number }[];
  topMeals: { name: string; orders: number; revenue: number }[];
  deliveryMetrics: { avgTime: number; successRate: number; totalDeliveries: number };
  lowStockItems: { name: string; stock: number; vendor_id: string }[];
}

const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "sales" | "delivery" | "inventory">("overview");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        { count: totalUsers },
        { count: totalOrders },
        { count: pendingApprovals },
        { count: activeDeliveries },
        { count: totalVendors },
        { count: totalRiders },
        { count: totalFarmers },
        { data: orders },
        { data: deliveries },
        { data: orderItems },
        { data: meals },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("delivery_assignments").select("*", { count: "exact", head: true }).in("status", ["searching", "offered", "accepted", "picked_up"]),
        supabase.from("vendor_profiles").select("*", { count: "exact", head: true }),
        supabase.from("rider_profiles").select("*", { count: "exact", head: true }),
        supabase.from("farmer_profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount, created_at, status, payment_status"),
        supabase.from("delivery_assignments").select("created_at, accepted_at, delivered_at, status"),
        supabase.from("order_items").select("meal_id, quantity, unit_price"),
        supabase.from("meals").select("id, name, stock_quantity, vendor_id"),
      ]);

      const totalRevenue = orders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;

      // Orders by day
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCounts = Array(7).fill(0);
      orders?.forEach(o => { dayCounts[new Date(o.created_at).getDay()]++; });

      // Revenue by month
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthRevenue = Array(12).fill(0);
      orders?.forEach(o => { monthRevenue[new Date(o.created_at).getMonth()] += Number(o.total_amount); });

      // Peak hours
      const hourCounts = Array(24).fill(0);
      orders?.forEach(o => { hourCounts[new Date(o.created_at).getHours()]++; });

      // Orders by status
      const statusMap: Record<string, number> = {};
      orders?.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });

      // Top meals
      const mealMap: Record<string, { orders: number; revenue: number }> = {};
      orderItems?.forEach(item => {
        if (!mealMap[item.meal_id]) mealMap[item.meal_id] = { orders: 0, revenue: 0 };
        mealMap[item.meal_id].orders += item.quantity;
        mealMap[item.meal_id].revenue += item.quantity * Number(item.unit_price);
      });
      const mealNames = new Map(meals?.map(m => [m.id, m.name]) || []);
      const topMeals = Object.entries(mealMap)
        .map(([id, v]) => ({ name: mealNames.get(id) || "Unknown", ...v }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 8);

      // Delivery metrics
      const completedDeliveries = deliveries?.filter(d => d.status === "delivered") || [];
      const avgTime = completedDeliveries.length > 0
        ? completedDeliveries.reduce((s, d) => {
            if (d.accepted_at && d.delivered_at) {
              return s + (new Date(d.delivered_at).getTime() - new Date(d.accepted_at).getTime());
            }
            return s;
          }, 0) / completedDeliveries.length / 60000
        : 0;

      // Low stock
      const lowStockItems = (meals || [])
        .filter(m => m.stock_quantity !== null && m.stock_quantity <= 10)
        .map(m => ({ name: m.name, stock: m.stock_quantity!, vendor_id: m.vendor_id }))
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10);

      setData({
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        activeDeliveries: activeDeliveries || 0,
        pendingApprovals: pendingApprovals || 0,
        avgDeliveryTime: Math.round(avgTime),
        ordersByDay: days.map((d, i) => ({ name: d, orders: dayCounts[i] })),
        revenueByMonth: months.map((m, i) => ({ name: m, revenue: Math.round(monthRevenue[i]) })),
        usersByRole: [
          { name: "Buyers", value: (totalUsers || 0) - (totalVendors || 0) - (totalRiders || 0) - (totalFarmers || 0) },
          { name: "Vendors", value: totalVendors || 0 },
          { name: "Riders", value: totalRiders || 0 },
          { name: "Farmers", value: totalFarmers || 0 },
        ],
        ordersByStatus: Object.entries(statusMap).map(([name, value]) => ({ name, value })),
        peakHours: hourCounts.map((c, i) => ({ hour: `${i}:00`, orders: c })),
        topMeals,
        deliveryMetrics: {
          avgTime: Math.round(avgTime),
          successRate: deliveries?.length ? Math.round((completedDeliveries.length / deliveries.length) * 100) : 0,
          totalDeliveries: deliveries?.length || 0,
        },
        lowStockItems,
      });
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Users", value: data.totalUsers, icon: Users, color: "primary" as const },
    { label: "Revenue", value: data.totalRevenue, prefix: "₦", icon: TrendingUp, color: "success" as const },
    { label: "Orders", value: data.totalOrders, icon: Package, color: "secondary" as const },
    { label: "Active Deliveries", value: data.activeDeliveries, icon: Truck, color: "primary" as const },
    { label: "Pending Approvals", value: data.pendingApprovals, icon: AlertTriangle, color: "destructive" as const },
    { label: "Avg Delivery (min)", value: data.avgDeliveryTime, icon: Clock, color: "success" as const },
  ];

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "sales" as const, label: "Sales" },
    { key: "delivery" as const, label: "Delivery" },
    { key: "inventory" as const, label: "Inventory" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Analytics Dashboard</h2>
        <Button variant="outline" size="sm" onClick={loadAll} className="font-body text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-xs font-body transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${kpi.color}/10`}>
                <kpi.icon className={`w-4 h-4 text-${kpi.color}`} />
              </div>
            </div>
            <p className="text-lg font-display font-bold text-foreground">
              {kpi.prefix}{kpi.value.toLocaleString()}
            </p>
            <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{kpi.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Orders by Day */}
            <div className="glass-card p-5">
              <h3 className="font-display text-sm font-semibold text-foreground mb-4">Orders by Day</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.ordersByDay}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Users by Role */}
            <div className="glass-card p-5">
              <h3 className="font-display text-sm font-semibold text-foreground mb-4">Users by Role</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.usersByRole} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.usersByRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status */}
          <div className="glass-card p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">Order Status Distribution</h3>
            <div className="flex flex-wrap gap-3">
              {data.ordersByStatus.map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-body text-foreground capitalize">{s.name}</span>
                  <span className="text-xs font-display font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "sales" && (
        <div className="space-y-4">
          {/* Revenue by Month */}
          <div className="glass-card p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">Revenue by Month (₦)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueByMonth}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Hours */}
          <div className="glass-card p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">Peak Order Hours</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.peakHours.filter((_, i) => i >= 6 && i <= 23)}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Meals */}
          <div className="glass-card p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-primary" /> Top Selling Meals
            </h3>
            {data.topMeals.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">No order data yet.</p>
            ) : (
              <div className="space-y-2">
                {data.topMeals.map((meal, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-display font-bold text-muted-foreground w-6">#{i + 1}</span>
                      <span className="text-sm font-body text-foreground">{meal.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground font-body">{meal.orders} sold</span>
                      <span className="text-xs font-display font-semibold text-foreground">₦{meal.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "delivery" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-foreground">{data.deliveryMetrics.avgTime} min</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Avg Delivery Time</p>
            </div>
            <div className="glass-card p-5 text-center">
              <Activity className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-foreground">{data.deliveryMetrics.successRate}%</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Success Rate</p>
            </div>
            <div className="glass-card p-5 text-center">
              <Truck className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-foreground">{data.deliveryMetrics.totalDeliveries}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Total Deliveries</p>
            </div>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Low Stock Alerts
            </h3>
            {data.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">All items are well-stocked! 🎉</p>
            ) : (
              <div className="space-y-2">
                {data.lowStockItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm font-body text-foreground">{item.name}</span>
                    <span className={`text-xs font-display font-bold px-2 py-1 rounded-full ${
                      item.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    }`}>
                      {item.stock === 0 ? "OUT OF STOCK" : `${item.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
