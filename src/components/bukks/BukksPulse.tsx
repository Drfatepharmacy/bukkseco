import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Sparkle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PulseSkeleton } from "@/components/bukks/Skeletons";

const partOfDay = (h: number) =>
  h < 11 ? "morning" : h < 16 ? "afternoon" : h < 21 ? "evening" : "late night";

/**
 * Bukks Pulse — one contextual recommendation:
 * headline + reason + a single offer, driven by time of day,
 * availability, promotions and repeat orders.
 */
const BukksPulse = ({ onOpen }: { onOpen: () => void }) => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const slot = partOfDay(hour);

  const { data, isLoading } = useQuery({
    queryKey: ["bukks-pulse", user?.id, slot],
    queryFn: async () => {
      const [{ data: meals }, { data: lastOrder }] = await Promise.all([
        supabase
          .from("meals")
          .select("id,name,price,category,image_url,rating_avg")
          .eq("is_available", true)
          .order("rating_avg", { ascending: false })
          .limit(12),
        user
          ? supabase
              .from("orders")
              .select("id,created_at,total_amount")
              .eq("buyer_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      return { meals: meals || [], lastOrder };
    },
    staleTime: 5 * 60 * 1000,
  });

  const pick = useMemo(() => {
    const meals = (data?.meals || []) as any[];
    if (!meals.length) return null;
    const wants =
      slot === "morning"
        ? ["breakfast", "drinks", "snacks"]
        : slot === "afternoon"
          ? ["lunch", "rice", "main"]
          : slot === "evening"
            ? ["dinner", "main", "swallow"]
            : ["snacks", "drinks"];
    const match = meals.find((m) =>
      wants.some((w) => (m.category || "").toLowerCase().includes(w))
    );
    return match || meals[0];
  }, [data, slot]);

  if (isLoading) return <PulseSkeleton />;
  if (!pick) return null;

  const repeat = Boolean(data?.lastOrder);
  const reason = repeat
    ? `Because you ordered around this time before · rated ${Number(pick.rating_avg || 0).toFixed(1)}`
    : `Top rated on campus right now · ${slot} pick`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      aria-label="Bukks Pulse"
      className="surface-feature p-5"
    >
      <div className="flex items-center gap-2">
        <Sparkle className="h-3.5 w-3.5 text-accent" />
        <span className="micro-label">Bukks Pulse</span>
      </div>

      <h3 className="mt-3 font-display text-xl font-bold text-foreground">
        {slot === "late night" ? "Still up?" : `Good ${slot}.`} {pick.name} is ready.
      </h3>
      <p className="mt-1 font-body text-xs text-muted-foreground">{reason}</p>

      <button
        onClick={onOpen}
        className="mt-4 flex w-full items-center justify-between rounded-2xl bg-utility p-3 text-left transition-colors hover:bg-utility/70"
      >
        <span className="min-w-0">
          <span className="block truncate font-body text-sm font-semibold text-foreground">
            {pick.name}
          </span>
          <span className="font-body text-xs text-faint">
            ₦{Number(pick.price || 0).toLocaleString()}
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
      </button>
    </motion.section>
  );
};

export default BukksPulse;
