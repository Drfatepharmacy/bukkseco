import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Plus, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const useCountdown = (targetDate: string) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

const CountdownDisplay = ({ expiresAt }: { expiresAt: string }) => {
  const { hours, minutes, seconds, expired } = useCountdown(expiresAt);

  if (expired) return <span className="text-destructive font-body text-sm font-semibold">Expired</span>;

  return (
    <div className="flex items-center gap-1">
      <Clock className="w-3.5 h-3.5 text-primary" />
      <span className="font-mono text-sm font-semibold text-primary">
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

const GroupBuySection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", mealId: "", groupPrice: "", minParticipants: "5", hours: "24" });

  const { data: groupBuys = [], isLoading } = useQuery({
    queryKey: ["group-buys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_buys")
        .select("*, meals(name, price, image_url, vendor_id)")
        .in("status", ["active"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Refresh every 10s for live updates
  });

  const { data: meals = [] } = useQuery({
    queryKey: ["all-meals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meals").select("id, name, price").eq("is_available", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ["my-participations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("group_buy_participants")
        .select("group_buy_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((p: any) => p.group_buy_id);
    },
    enabled: !!user,
  });

  const createGroupBuy = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please log in");
      const meal = meals.find((m: any) => m.id === form.mealId);
      if (!meal) throw new Error("Select a meal");

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(form.hours));

      const { data, error } = await supabase.from("group_buys").insert({
        meal_id: form.mealId,
        creator_id: user.id,
        title: form.title.trim(),
        original_price: Number(meal.price),
        group_price: parseFloat(form.groupPrice),
        min_participants: parseInt(form.minParticipants),
        expires_at: expiresAt.toISOString(),
      }).select().single();

      if (error) throw error;

      // Creator auto-joins
      await supabase.from("group_buy_participants").insert({
        group_buy_id: data.id,
        user_id: user.id,
      });
    },
    onSuccess: () => {
      toast.success("Group buy created! 🎉");
      queryClient.invalidateQueries({ queryKey: ["group-buys"] });
      queryClient.invalidateQueries({ queryKey: ["my-participations"] });
      setShowCreate(false);
      setForm({ title: "", mealId: "", groupPrice: "", minParticipants: "5", hours: "24" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const joinGroupBuy = useMutation({
    mutationFn: async (groupBuyId: string) => {
      if (!user) throw new Error("Please log in");
      const { error } = await supabase.from("group_buy_participants").insert({
        group_buy_id: groupBuyId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You joined the group buy! 🤝");
      queryClient.invalidateQueries({ queryKey: ["group-buys"] });
      queryClient.invalidateQueries({ queryKey: ["my-participations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Group Buys</h2>
          <p className="text-sm text-muted-foreground font-body">Join orders to unlock group discounts</p>
        </div>
        {user && (
          <Button onClick={() => setShowCreate(!showCreate)} className="btn-gold">
            <Plus className="w-4 h-4 mr-2" /> Create Group Buy
          </Button>
        )}
      </div>

      {showCreate && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="geo-card p-6 mb-6"
          onSubmit={(e) => { e.preventDefault(); createGroupBuy.mutate(); }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Group Buy Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lunch deal for Block A" required className="bg-muted/50 font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Select Meal</Label>
              <select
                required
                className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-body"
                value={form.mealId}
                onChange={(e) => setForm({ ...form, mealId: e.target.value })}
              >
                <option value="">Select a meal</option>
                {meals.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} — ₦{Number(m.price).toLocaleString()}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Group Price (₦)</Label>
              <Input type="number" min="0" step="0.01" value={form.groupPrice} onChange={(e) => setForm({ ...form, groupPrice: e.target.value })} placeholder="1800" required className="bg-muted/50 font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Min Participants</Label>
              <Input type="number" min="2" value={form.minParticipants} onChange={(e) => setForm({ ...form, minParticipants: e.target.value })} className="bg-muted/50 font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Duration (hours)</Label>
              <Input type="number" min="1" max="72" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="bg-muted/50 font-body" />
            </div>
          </div>
          <Button type="submit" disabled={createGroupBuy.isPending} className="btn-gold mt-4">
            {createGroupBuy.isPending ? "Creating..." : "Launch Group Buy"}
          </Button>
        </motion.form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground font-body">Loading group buys...</div>
      ) : groupBuys.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-body">No active group buys yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupBuys.map((gb: any, i: number) => {
            const savings = Math.round(((gb.original_price - gb.group_price) / gb.original_price) * 100);
            const progress = (gb.current_participants / gb.min_participants) * 100;
            const hasJoined = myParticipations.includes(gb.id);

            return (
              <motion.div
                key={gb.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="geo-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{gb.title}</h3>
                    <p className="text-xs text-muted-foreground font-body">{gb.meals?.name}</p>
                  </div>
                  <div className="bg-success/10 text-success text-xs font-body font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {savings}% off
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div>
                    <span className="text-xs text-muted-foreground font-body line-through">₦{Number(gb.original_price).toLocaleString()}</span>
                    <span className="font-display font-bold text-foreground ml-2">₦{Number(gb.group_price).toLocaleString()}</span>
                  </div>
                  <CountdownDisplay expiresAt={gb.expires_at} />
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-body text-muted-foreground mb-1">
                    <span>{gb.current_participants}/{gb.min_participants} joined</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {user && !hasJoined && gb.creator_id !== user.id && (
                  <Button
                    onClick={() => joinGroupBuy.mutate(gb.id)}
                    disabled={joinGroupBuy.isPending}
                    className="w-full mt-4 btn-gold"
                    size="sm"
                  >
                    Join Group Buy <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {hasJoined && (
                  <div className="mt-4 text-center text-sm text-success font-body font-semibold">✓ You've joined this group buy</div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupBuySection;
