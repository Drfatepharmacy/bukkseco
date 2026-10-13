import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ChefHat, Clock, RefreshCw, X } from "lucide-react";

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_fee: number | null;
  delivery_address: string | null;
  notes: string | null;
  payment_status: string | null;
  prep_minutes: number | null;
  created_at: string;
  order_items?: { quantity: number; meals: { name: string } | null }[];
};
type Meal = { id: string; name: string; is_available: boolean; stock_quantity: number | null };

const ACTIVE = ["pending", "confirmed", "preparing", "ready"];
const PREP = [10, 20, 30];
const DECLINE = ["Out of stock", "Kitchen closed", "Too busy"];
const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const STATUS_LABEL: Record<string, string> = {
  pending: "New", confirmed: "Accepted", preparing: "Preparing", ready: "Ready for pickup",
};

const VendorKitchen = () => {
  const { user } = useAuth();
  const { playSound } = useSoundNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [today, setToday] = useState<Order[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (!user) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const [a, t, m] = await Promise.all([
      supabase.from("orders")
        .select("id,order_number,status,total_amount,delivery_fee,delivery_address,notes,payment_status,prep_minutes,created_at,order_items(quantity,meals(name))")
        .eq("vendor_id", user.id).in("status", ACTIVE as never).order("created_at", { ascending: true }),
      supabase.from("orders").select("id,status,total_amount,delivery_fee,payment_status,created_at")
        .eq("vendor_id", user.id).gte("created_at", start.toISOString()),
      supabase.from("meals").select("id,name,is_available,stock_quantity").eq("vendor_id", user.id).order("name"),
    ]);
    setOrders((a.data as unknown as Order[]) ?? []);
    setToday((t.data as unknown as Order[]) ?? []);
    setMeals((m.data as Meal[]) ?? []);
    setLoading(false);
    loaded.current = true;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel(`kitchen-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${user.id}` }, (p) => {
        if (p.eventType === "INSERT" && loaded.current) {
          playSound("order");
          toast.success("New order received");
        }
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load, playSound]);

  const update = async (id: string, patch: Record<string, unknown>, msg: string) => {
    setBusy(id);
    const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
    setBusy(null);
    if (error) return toast.error("Could not update order. Try again.");
    toast.success(msg);
    setDeclining(null);
    load();
  };

  const toggleMeal = async (meal: Meal, val: boolean) => {
    setMeals((ms) => ms.map((m) => (m.id === meal.id ? { ...m, is_available: val } : m)));
    const { error } = await supabase.from("meals").update({ is_available: val }).eq("id", meal.id);
    if (error) {
      toast.error("Could not change availability");
      setMeals((ms) => ms.map((m) => (m.id === meal.id ? { ...m, is_available: !val } : m)));
    }
  };

  const stats = useMemo(() => {
    const valid = today.filter((o) => o.status !== "cancelled");
    const revenue = valid.filter((o) => o.payment_status === "paid")
      .reduce((s, o) => s + Number(o.total_amount) - Number(o.delivery_fee ?? 0), 0);
    return { count: valid.length, revenue, pending: orders.filter((o) => o.status === "pending").length };
  }, [today, orders]);

  if (loading) {
    return <div className="flex justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {[["Today", String(stats.count)], ["Earned", naira(stats.revenue)], ["New", String(stats.pending)]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="font-display text-lg font-bold text-foreground">{v}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">Live queue</h2>
        {orders.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <ChefHat className="mx-auto mb-2 h-8 w-8" />
            No active orders. New orders appear here instantly.
          </div>
        )}
        {orders.map((o) => (
          <article key={o.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-foreground">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {o.prep_minutes ? ` · ${o.prep_minutes} min prep` : ""}
                </p>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${o.status === "pending" ? "bg-primary text-primary-foreground" : o.status === "ready" ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground"}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
                <p className={`mt-1 text-xs ${o.payment_status === "paid" ? "text-success" : "text-muted-foreground"}`}>
                  {o.payment_status === "paid" ? "Paid" : "Awaiting payment"}
                </p>
              </div>
            </div>
            <ul className="text-sm text-foreground">
              {(o.order_items ?? []).map((it, i) => (
                <li key={i}>{it.quantity}× {it.meals?.name ?? "Item"}</li>
              ))}
            </ul>
            {o.delivery_address && <p className="text-xs text-muted-foreground">To: {o.delivery_address}</p>}
            {o.notes && <p className="text-xs text-muted-foreground">Note: {o.notes}</p>}
            <p className="text-sm font-semibold text-foreground">{naira(Number(o.total_amount))}</p>

            {o.status === "pending" && declining !== o.id && (
              <div className="space-y-2">
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />Accept with prep time</p>
                <div className="grid grid-cols-3 gap-2">
                  {PREP.map((m) => (
                    <Button key={m} className="h-11" disabled={busy === o.id}
                      onClick={() => update(o.id, { status: "confirmed", prep_minutes: m, accepted_at: new Date().toISOString() }, `Accepted · ${m} min`)}>
                      {m}m
                    </Button>
                  ))}
                </div>
                <Button variant="outline" className="h-11 w-full" onClick={() => setDeclining(o.id)}>Decline</Button>
              </div>
            )}
            {o.status === "pending" && declining === o.id && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Reason for declining</p>
                  <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Cancel" onClick={() => setDeclining(null)}><X className="h-4 w-4" /></Button>
                </div>
                {DECLINE.map((r) => (
                  <Button key={r} variant="outline" className="h-11 w-full" disabled={busy === o.id}
                    onClick={() => update(o.id, { status: "cancelled", decline_reason: r }, "Order declined")}>
                    {r}
                  </Button>
                ))}
              </div>
            )}
            {o.status === "confirmed" && (
              <Button className="h-11 w-full" disabled={busy === o.id} onClick={() => update(o.id, { status: "preparing" }, "Marked preparing")}>Start preparing</Button>
            )}
            {o.status === "preparing" && (
              <Button className="h-11 w-full" disabled={busy === o.id} onClick={() => update(o.id, { status: "ready" }, "Ready for rider pickup")}>Mark ready for pickup</Button>
            )}
            {o.status === "ready" && <p className="text-center text-xs text-muted-foreground">Waiting for a rider to collect</p>}
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">Menu availability</h2>
        {meals.length === 0 && <p className="text-sm text-muted-foreground">Add meals in Products to manage availability.</p>}
        {meals.map((m) => (
          <label key={m.id} className="flex min-h-[44px] items-center justify-between rounded-xl border border-border bg-card px-4 py-2">
            <span>
              <span className="block text-sm font-medium text-foreground">{m.name}</span>
              <span className="text-xs text-muted-foreground">
                {m.is_available ? "In stock" : "Sold out"}{m.stock_quantity != null ? ` · ${m.stock_quantity} left` : ""}
              </span>
            </span>
            <Switch checked={m.is_available} onCheckedChange={(v) => toggleMeal(m, v)} aria-label={`${m.name} availability`} />
          </label>
        ))}
      </section>
    </div>
  );
};

export default VendorKitchen;
