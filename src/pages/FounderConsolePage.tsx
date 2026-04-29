import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  CreditCard,
  AlertTriangle,
  Map,
  Cpu,
  Globe,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const data = [
  { name: 'Mon', revenue: 4000, users: 2400 },
  { name: 'Tue', revenue: 3000, users: 1398 },
  { name: 'Wed', revenue: 2000, users: 9800 },
  { name: 'Thu', revenue: 2780, users: 3908 },
  { name: 'Fri', revenue: 1890, users: 4800 },
  { name: 'Sat', revenue: 2390, users: 3800 },
  { name: 'Sun', revenue: 3490, users: 4300 },
];

const FounderConsolePage = () => {
  return (
    <div className="container px-6 py-12 max-w-[1600px] mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-50">Global Network Control</span>
           </div>
           <h1 className="text-5xl font-bold tracking-tighter">Founder Console</h1>
        </div>

        <div className="flex gap-4">
           <div className="bg-success/10 text-success border border-success/20 rounded-xl px-6 py-3 flex items-center gap-3">
              <div className="w-2 h-2 bg-success rounded-full animate-ping" />
              <span className="text-sm font-bold">System Status: Optimal</span>
           </div>
        </div>
      </header>

      {/* Global Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Total Revenue", value: "₦124.5M", trend: "+12.5%", positive: true, icon: TrendingUp },
          { label: "Active Nodes (Campuses)", value: "12", trend: "+2", positive: true, icon: Globe },
          { label: "Global Users", value: "85.2k", trend: "+5.2%", positive: true, icon: Users },
          { label: "Risk Score", value: "0.04%", trend: "-0.01%", positive: true, icon: AlertTriangle },
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card p-8 group"
          >
            <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <metric.icon className="w-6 h-6" />
               </div>
               <div className={`flex items-center gap-1 text-sm font-bold ${metric.positive ? 'text-success' : 'text-destructive'}`}>
                  {metric.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {metric.trend}
               </div>
            </div>
            <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{metric.label}</div>
            <div className="text-4xl font-bold tracking-tight">{metric.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Growth Chart */}
        <div className="lg:col-span-2 premium-card p-8">
           <div className="flex items-center justify-between mb-12">
              <div>
                 <h3 className="text-2xl font-bold tracking-tight">Ecosystem Growth</h3>
                 <p className="text-muted-foreground text-sm">Revenue vs User acquisition across all tenants.</p>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-muted rounded-lg text-xs font-bold">7D</button>
                 <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold">30D</button>
                 <button className="px-4 py-2 bg-muted rounded-lg text-xs font-bold">12M</button>
              </div>
           </div>

           <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* AI Insights Panel */}
        <div className="premium-card p-8 bg-dark text-white border-none relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-20">
              <Cpu className="w-32 h-32 text-primary" />
           </div>

           <div className="relative z-10">
              <h3 className="text-2xl font-bold tracking-tight mb-8">AI Business Insights</h3>

              <div className="space-y-6">
                 {[
                   { title: "Expansion Opportunity", desc: "UNILAG shows 45% higher organic demand than projected. Recommendation: Launch Phase 1 ahead of schedule.", priority: "High" },
                   { title: "Unit Economics", desc: "Rider incentive burn in UNIBEN has decreased by 12% due to route optimization.", priority: "Insight" },
                   { title: "Risk Alert", desc: "Unusual wallet funding pattern detected in LASU node. 4 accounts flagged for review.", priority: "Urgent" }
                 ].map((insight, i) => (
                   <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                         <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                           insight.priority === 'Urgent' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                         }`}>
                           {insight.priority}
                         </span>
                         <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="font-bold mb-2">{insight.title}</h4>
                      <p className="text-sm text-white/40 leading-relaxed">{insight.desc}</p>
                   </div>
                 ))}
              </div>

              <button className="w-full mt-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.02] transition-transform">
                 Generate Full Report
              </button>
           </div>
        </div>
      </div>

      {/* Tenant Performance Table */}
      <div className="premium-card overflow-hidden">
         <div className="p-8 border-b border-border">
            <h3 className="text-2xl font-bold tracking-tight">Node Performance</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="bg-muted/50 text-left">
                     <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest opacity-50">Campus Node</th>
                     <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest opacity-50">Monthly Revenue</th>
                     <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest opacity-50">Active Users</th>
                     <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest opacity-50">Status</th>
                     <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest opacity-50">Health Score</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {[
                    { name: "UNIBEN Bukks", rev: "₦42.5M", users: "18.2k", status: "Active", score: 98 },
                    { name: "UNILAG Bukks", rev: "₦38.2M", users: "15.4k", status: "Active", score: 95 },
                    { name: "LASU Bukks", rev: "₦22.1M", users: "8.9k", status: "Active", score: 88 },
                    { name: "AAU Bukks", rev: "₦12.4M", users: "4.2k", status: "Deploying", score: 0 },
                  ].map((node, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors cursor-pointer">
                       <td className="px-8 py-6 font-bold">{node.name}</td>
                       <td className="px-8 py-6">{node.rev}</td>
                       <td className="px-8 py-6">{node.users}</td>
                       <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            node.status === 'Active' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                          }`}>
                            {node.status}
                          </span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${node.score}%` }}
                                  className="h-full bg-primary"
                                />
                             </div>
                             <span className="text-xs font-bold">{node.score}%</span>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default FounderConsolePage;
