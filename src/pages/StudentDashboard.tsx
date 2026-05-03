import { motion } from "framer-motion";
import {
  Wallet,
  Star,
  Clock,
  ChevronRight,
  Search,
  MapPin,
  TrendingUp,
  Zap,
  ArrowUpRight,
  Coins,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard } from "@/components/ui/kpi-card";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container px-6 py-12 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
             Feed your <span className="gradient-text">ambition.</span>
           </h1>
           <p className="text-muted-foreground font-body flex items-center gap-2">
             <MapPin className="w-4 h-4 text-primary" />
             Delivering to <span className="text-foreground font-bold">Hall 2, UNIBEN</span>
           </p>
        </div>

        <div className="relative w-full md:w-96 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
           <input
             className="w-full h-14 pl-12 pr-4 bg-muted border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body"
             placeholder="Search for meals or vendors..."
           />
        </div>
      </header>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <motion.div
           whileHover={{ y: -5 }}
           className="premium-card p-8 bg-dark text-white border-none cursor-pointer group"
           onClick={() => navigate("/wallet")}
         >
            <div className="flex justify-between items-start mb-12">
               <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                  <Wallet className="w-6 h-6" />
               </div>
               <ArrowUpRight className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Wallet Balance</div>
            <div className="text-4xl font-bold">₦12,450.00</div>
         </motion.div>

         <div className="md:col-span-2 premium-card p-8 bg-gradient-to-br from-primary/20 to-transparent border-primary/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Zap className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
               <div>
                  <h3 className="text-2xl font-bold mb-2">Group Buy: Jollof Feast</h3>
                  <p className="text-muted-foreground text-sm max-w-md">18/25 students joined. Save ₦400 if 7 more join in the next 2h.</p>
               </div>
               <button className="btn-gold w-fit mt-6">
                  Join Group & Save
               </button>
            </div>
         </div>
      </div>

      {/* Featured/Recent Vendors */}
      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight">Top Rated Nearby</h3>
            <button className="text-primary font-bold flex items-center gap-2">
               View All <ChevronRight className="w-4 h-4" />
            </button>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Mama Africa", rating: "4.9", time: "15-20 min", img: "🍱", tags: ["Local", "Cheap"] },
              { name: "Chef's Plate", rating: "4.7", time: "25-30 min", img: "🍝", tags: ["Continental"] },
              { name: "Campus Grill", rating: "4.8", time: "10-15 min", img: "🍔", tags: ["Fast Food"] },
              { name: "Bukka Express", rating: "4.5", time: "20-25 min", img: "🍚", tags: ["Traditional"] },
            ].map((vendor, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card overflow-hidden group cursor-pointer"
              >
                 <div className="h-40 bg-muted flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
                    {vendor.img}
                 </div>
                 <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="font-bold text-lg">{vendor.name}</h4>
                       <div className="flex items-center gap-1 text-sm font-bold">
                          <Star className="w-4 h-4 text-primary fill-primary" />
                          {vendor.rating}
                       </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-body mb-4">
                       <Clock className="w-3.5 h-3.5" />
                       {vendor.time}
                    </div>
                    <div className="flex gap-2">
                       {vendor.tags.map(tag => (
                         <span key={tag} className="px-2 py-1 bg-muted rounded-md text-[10px] font-bold uppercase tracking-wider">{tag}</span>
                       ))}
                    </div>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* AI Recommendation Section */}
      <div className="premium-card p-10 bg-secondary text-white border-none overflow-hidden relative">
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <TrendingUp className="w-48 h-48" />
         </div>
         <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1 mb-6">
               <Zap className="w-4 h-4 text-primary" />
               <span className="text-xs font-bold uppercase tracking-widest">AI Recommendation</span>
            </div>
            <h3 className="text-3xl font-bold mb-4">You might love "Egusi Special" today.</h3>
            <p className="text-white/60 text-lg mb-8 leading-relaxed">Based on your preference for local swallows and the fact that Chef's Plate just restocked fresh Egusi.</p>
            <button className="bg-white text-secondary px-10 py-4 rounded-xl font-bold hover:scale-105 transition-transform">
               Order for ₦2,200
            </button>
         </div>
      </div>
    </div>
  );
};


export default StudentDashboard;
