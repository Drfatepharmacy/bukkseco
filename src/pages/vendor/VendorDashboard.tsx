import { motion } from "framer-motion";
import {
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  Clock,
  Zap,
  Plus,
  Coins,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const data = [
  { name: '08:00', orders: 4 },
  { name: '10:00', orders: 7 },
  { name: '12:00', orders: 15 },
  { name: '14:00', orders: 12 },
  { name: '16:00', orders: 8 },
  { name: '18:00', orders: 20 },
  { name: '20:00', orders: 14 },
];

const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["vendor-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      return data;
    },
  });

  return (
    <div className="container px-6 py-12 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
             Welcome back, <span className="gradient-text">{profile?.business_name || 'Merchant'}</span>
           </h1>
           <p className="text-muted-foreground font-body">Your kitchen is currently <span className="text-success font-bold">Open</span> and accepting orders.</p>
        </div>

        <div className="flex gap-4">
           <button
             onClick={() => navigate("/vendor/menu")}
             className="btn-gold h-14 px-8 flex items-center gap-2"
           >
              <Plus className="w-5 h-5" />
              Add New Item
           </button>
        </div>
      </header>

      {/* KPI Grid — shared UI from AnalyticsDashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Today's Revenue" value="42,500" prefix="₦" icon={Coins} tone="success" trend="+18%" delay={0} />
        <KpiCard label="Active Orders" value="12" icon={ShoppingBag} tone="primary" trend="Normal" delay={0.05} />
        <KpiCard label="Avg. Prep Time" value="14m" icon={Clock} tone="purple" trend="-2m" delay={0.1} />
        <KpiCard label="Trend" value="+18%" icon={TrendingUp} tone="gold" trend="vs last wk" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders Flow Chart */}
        <SectionCard
          title="Orders Flow"
          className="lg:col-span-2"
          action={
            <select className="bg-muted border-none rounded-lg text-xs font-body px-3 py-1.5 outline-none">
              <option>Today</option>
              <option>Yesterday</option>
            </select>
          }
        >
           <div className="h-[260px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                  <Tooltip
                    cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* AI Growth Suggestions */}
        <div className="premium-card p-8 bg-secondary text-white border-none overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap className="w-48 h-48" />
           </div>

           <div className="relative z-10">
              <h3 className="text-2xl font-bold tracking-tight mb-8 flex items-center gap-2">
                 <Zap className="w-6 h-6 text-primary fill-primary" />
                 AI Growth Tips
              </h3>

              <div className="space-y-6">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                    <h4 className="font-bold mb-2">Demand Peak Alert</h4>
                    <p className="text-sm text-white/60">Jollof Rice demand usually spikes at 12:30 PM. Prep extra 10 portions today?</p>
                 </div>

                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                    <h4 className="font-bold mb-2">Top Combo Suggestion</h4>
                    <p className="text-sm text-white/60">Customers often buy Fried Rice with extra Plantain. Try creating a "Student Combo" for 10% off.</p>
                 </div>
              </div>

              <button className="w-full mt-8 py-4 bg-white text-secondary font-bold rounded-xl hover:scale-105 transition-transform">
                 View Marketing Suite
              </button>
           </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight">Live Orders</h3>
            <button
              onClick={() => navigate("/vendor/orders")}
              className="text-primary font-bold flex items-center gap-2"
            >
               Order Center <ChevronRight className="w-4 h-4" />
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((order) => (
              <div key={order} className="premium-card p-6 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl">
                       🥡
                    </div>
                    <div>
                       <div className="flex items-center gap-3 mb-1">
                          <h5 className="font-bold">#ORD-2849</h5>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded">Preparing</span>
                       </div>
                       <p className="text-sm text-muted-foreground font-body">2x Chicken Jollof • ₦5,000</p>
                    </div>
                 </div>
                 <button className="h-12 w-12 rounded-xl bg-dark text-white flex items-center justify-center hover:bg-primary hover:text-dark transition-colors">
                    <ChevronRight className="w-6 h-6" />
                 </button>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
