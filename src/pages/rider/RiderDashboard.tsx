import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  Star,
  Zap,
  ArrowRight,
  TrendingUp,
  Coins,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";

const RiderDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container px-6 py-12 max-w-5xl mx-auto space-y-12">
      <header className="flex items-center justify-between">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-success">Online • Ready</span>
           </div>
           <h1 className="text-4xl font-bold tracking-tight">Rider Terminal</h1>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden border-2 border-primary">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rider" alt="Avatar" />
        </div>
      </header>

      {/* Online Status Toggle - Premium UX */}
      <div className="bg-dark rounded-[2rem] p-8 text-white flex items-center justify-between overflow-hidden relative group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <Zap className="w-32 h-32 text-primary" />
         </div>
         <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Current Session</h3>
            <p className="text-white/40 text-sm font-body">Active for 4h 12m • 8 deliveries today</p>
         </div>
         <button className="relative z-10 btn-gold px-12 h-16 text-lg">
            Set Offline
         </button>
      </div>

      {/* Rider Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { label: "Earnings", value: "₦12,400", icon: CreditCard, color: "text-success" },
           { label: "Deliveries", value: "148", icon: CheckCircle2, color: "text-primary" },
           { label: "Rating", value: "4.9", icon: Star, color: "text-gold" },
           { label: "Avg. Time", value: "12m", icon: Clock, color: "text-purple" },
         ].map((stat, i) => (
           <div key={i} className="premium-card p-6 text-center">
              <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4 ${stat.color}`}>
                 <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
           </div>
         ))}
      </div>

      {/* Live Requests / Assignments */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight">Available Requests</h3>
            <div className="flex items-center gap-2 text-primary text-sm font-bold">
               <Navigation className="w-4 h-4 animate-bounce" />
               Searching in UNIBEN Node...
            </div>
         </div>

         <div className="space-y-4">
            {[1].map((request) => (
              <motion.div
                key={request}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-card p-8 border-2 border-primary/20 bg-primary/5"
              >
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex gap-6">
                       <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm">
                          🍔
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                             <h4 className="text-xl font-bold">New Delivery Available</h4>
                             <span className="px-2 py-0.5 bg-success/20 text-success text-[10px] font-bold uppercase rounded">₦800 Fee</span>
                          </div>
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                                <MapPin className="w-4 h-4" />
                                <span className="font-bold text-foreground">Pick up:</span> Mama's Kitchen (Main Gate)
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                                <Navigation className="w-4 h-4" />
                                <span className="font-bold text-foreground">Drop off:</span> Hall 2, Room 42
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <button className="flex-1 md:flex-none px-12 h-16 btn-gold text-lg">
                          Accept Order
                       </button>
                    </div>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Peak Zone Alerts */}
      <div className="premium-card p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
         <div className="flex items-center gap-4 mb-6">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold tracking-tight">Peak Hour Bonus</h3>
         </div>
         <p className="text-muted-foreground mb-8 max-w-xl font-body">
            High demand detected around the <span className="text-foreground font-bold">Engineering Faculty</span>.
            Earn an extra <span className="text-success font-bold">₦200 per delivery</span> for the next 45 minutes.
         </p>
         <div className="flex items-center gap-2 text-primary font-bold cursor-pointer hover:gap-3 transition-all">
            Navigate to zone <ArrowRight className="w-5 h-5" />
         </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
