import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";

const AdminDashboard = () => {
  return (
    <div className="container px-6 py-12 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Campus Control Center</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight">UNIBEN Bukks Admin</h1>
        </div>

        <div className="flex items-center gap-3 bg-muted rounded-xl p-1 px-4 h-12">
           <Search className="w-4 h-4 opacity-40" />
           <input className="bg-transparent border-none outline-none text-sm w-48" placeholder="Search orders, users..." />
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         {[
           { label: "Today's Orders", value: "284", trend: "+12", icon: ShoppingBag, color: "text-primary" },
           { label: "New Vendors", value: "8", trend: "+2", icon: Users, color: "text-success" },
           { label: "Active Riders", value: "42", trend: "Normal", icon: ShieldCheck, color: "text-purple" },
           { label: "Open Disputes", value: "3", trend: "-1", icon: AlertTriangle, color: "text-destructive" },
         ].map((stat, i) => (
           <div key={i} className="premium-card p-8">
              <div className="flex items-center justify-between mb-4">
                 <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-bold opacity-40">{stat.trend}</span>
              </div>
              <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-3xl font-bold">{stat.value}</div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Pending Approvals */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight">Pending Approvals</h3>
              <button className="text-sm font-bold text-primary">View Queue</button>
           </div>

           <div className="space-y-4">
              {[
                { name: "Kitchen 101", type: "Vendor", date: "2h ago", avatar: "🍳" },
                { name: "John Doe", type: "Rider", date: "4h ago", avatar: "🚲" },
                { name: "Fresh Farms", type: "Farmer", date: "5h ago", avatar: "🥬" },
              ].map((item, i) => (
                <div key={i} className="premium-card p-6 flex items-center justify-between group">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                         {item.avatar}
                      </div>
                      <div>
                         <h5 className="font-bold">{item.name}</h5>
                         <p className="text-xs text-muted-foreground font-body">{item.type} • Requested {item.date}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-all">
                         <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all">
                         <XCircle className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Live System Logs */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight">System Logs</h3>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Live Sync</span>
              </div>
           </div>

           <div className="bg-dark rounded-[2.5rem] p-8 text-white/80 font-mono text-sm space-y-4 h-[420px] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent z-10 pointer-events-none" />
              {[
                "[14:22:04] ORDER_PLACED: #ORD-9821 in UNIBEN Node",
                "[14:21:45] WALLET_FUNDED: User (..8f2) +₦5,000 via Paystack",
                "[14:20:12] RIDER_ASSIGNED: #ORD-9815 -> Rider (..2a1)",
                "[14:18:30] VENDOR_OFFLINE: 'Mama Africa' kitchen closed",
                "[14:15:22] SECURITY_ALERT: 3 failed login attempts (..9c4)",
                "[14:12:05] SYSTEM: Daily automated settlements processed",
                "[14:08:44] ORDER_DELIVERED: #ORD-9788 (14 min total)",
                "[14:05:12] DISPUTE_OPENED: #ORD-9755 'Late delivery'",
              ].map((log, i) => (
                <div key={i} className="flex gap-4 opacity-60 hover:opacity-100 transition-opacity">
                   <span className="text-primary font-bold whitespace-nowrap">{log.split(' ')[0]}</span>
                   <span className="truncate">{log.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
