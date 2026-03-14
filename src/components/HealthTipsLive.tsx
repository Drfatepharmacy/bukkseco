import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const HealthTipsLive = () => {
  const { data: tips = [] } = useQuery({
    queryKey: ["health-tips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_tips")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const emojis: Record<string, string> = {
    hydration: "💧",
    nutrition: "🥗",
    wellness: "🧘",
    cooking: "👨‍🍳",
    general: "💡",
  };

  if (tips.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Daily Health Tips</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map((tip: any, i: number) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="geo-card p-5"
          >
            <span className="text-2xl mb-2 block">{emojis[tip.category] || "💡"}</span>
            <h4 className="font-display font-semibold text-foreground text-sm mb-1">{tip.title}</h4>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">{tip.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HealthTipsLive;
