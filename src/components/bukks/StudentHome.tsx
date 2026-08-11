import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, UtensilsCrossed, Store, Bike, User as UserIcon, PackageSearch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CommandDeck from "@/components/bukks/CommandDeck";
import BukksPulse from "@/components/bukks/BukksPulse";
import BookingLine from "@/components/bukks/BookingLine";
import { OrderSkeleton, EmptyState } from "@/components/bukks/Skeletons";

const STAGES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];

const greeting = () => {
  const h = new Date().getHours();
  return h < 11 ? "Good morning" : h < 16 ? "Good afternoon" : h < 21 ? "Good evening" : "Late night";
};

const StudentHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const name =
    (user?.user_metadata as any)?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const { data: activeOrder, isLoading } = useQuery({
    queryKey: ["student-active-order", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("orders")
        .select("id,status,total_amount,delivery_address,created_at")
        .eq("buyer_id", user.id)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    refetchInterval: 20000,
  });

  const stageIndex = Math.max(0, STAGES.indexOf((activeOrder as any)?.status || "pending"));

  const goto = (zone: "eat" | "shop" | "together" | "discover") => {
    if (zone === "together") {
      document.getElementById("together")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate("/app/explore");
  };

  return (
    <div className="space-y-6">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="micro-label">{greeting()}</p>
        <h2 className="font-display text-3xl font-bold text-foreground">{name}</h2>
        <p className="mt-1 flex items-center gap-1.5 font-body text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-accent" />
          Delivering to UNIBEN campus
        </p>
      </motion.header>

      <CommandDeck onSelect={goto} />

      <BukksPulse onOpen={() => navigate("/app/explore")} />

      <section aria-label="Active order" className="surface-utility p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="micro-label">Active order</span>
          {activeOrder && (
            <button
              onClick={() => navigate("/app/orders")}
              className="font-body text-xs font-semibold text-primary"
            >
              View
            </button>
          )}
        </div>

        {isLoading ? (
          <OrderSkeleton />
        ) : activeOrder ? (
          <BookingLine
            active={stageIndex}
            nodes={[
              { label: "Meal", icon: UtensilsCrossed },
              { label: "Vendor", icon: Store },
              { label: "Kitchen", icon: PackageSearch },
              { label: "Rider", icon: Bike },
              { label: "You", icon: UserIcon },
            ]}
          />
        ) : (
          <EmptyState
            icon={PackageSearch}
            title="Nothing on the way"
            hint="Your next order will track live along the Bukks line."
          />
        )}
      </section>
    </div>
  );
};

export default StudentHome;
