import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, MapPin, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ORDER_STAGES, stageIndex } from "@/config/campus";

const naira = (n: number) => `₦${Math.round(Number(n) || 0).toLocaleString("en-NG")}`;
const PAY_LABEL: Record<string, string> = {
  paid: "Paid", verifying: "Confirming payment", pending: "Awaiting payment", failed: "Payment failed",
};

const OrderTrackingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["track-order", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id!).maybeSingle();
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["track-order-items", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("id,quantity,unit_price,meal_id,meals(name)").eq("order_id", id!);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (p) => {
        qc.setQueryData(["track-order", id], p.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  if (isLoading || loading) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-background"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const current = stageIndex(order?.status);
  const cancelled = order?.status === "cancelled";

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-2">
          <button aria-label="Back" onClick={() => navigate("/app/orders")} className="flex h-11 w-11 items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Track order</h1>
        </div>
      </header>

      {!order ? (
        <p className="p-6 text-center font-body text-muted-foreground">We couldn't find this order.</p>
      ) : (
        <main className="mx-auto max-w-2xl space-y-5 px-4 py-5" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          <section className="rounded-2xl border border-border bg-card p-4">
            <p className="font-body text-xs text-muted-foreground">{order.order_number}</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">
              {cancelled ? "Cancelled" : ORDER_STAGES[current].label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 font-body text-xs">
              <span className={`rounded-full px-2.5 py-1 ${order.payment_status === "paid" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {PAY_LABEL[order.payment_status || "pending"] ?? order.payment_status}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                <MapPin className="h-3 w-3" /> {order.delivery_address}
              </span>
            </div>
          </section>

          <section aria-label="Progress" className="rounded-2xl border border-border bg-card p-4">
            {cancelled ? (
              <p className="flex items-center gap-2 font-body text-sm text-destructive"><XCircle className="h-5 w-5" /> This order was cancelled.</p>
            ) : (
              <ol className="space-y-0">
                {ORDER_STAGES.map((s, i) => {
                  const done = i <= current;
                  return (
                    <li key={s.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>
                          {done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                        </span>
                        {i < ORDER_STAGES.length - 1 && <span className={`w-0.5 flex-1 min-h-6 ${i < current ? "bg-primary" : "bg-border"}`} />}
                      </div>
                      <p className={`pb-5 pt-1 font-body text-sm ${done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 font-display text-base font-bold text-foreground">Items</h2>
            <ul className="space-y-1.5 font-body text-sm">
              {items.map((it: any) => (
                <li key={it.id} className="flex justify-between">
                  <span className="text-foreground">{it.quantity}× {it.meals?.name ?? "Meal"}</span>
                  <span className="text-muted-foreground">{naira(it.unit_price * it.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{naira(order.delivery_fee)}</span></li>
              <li className="flex justify-between border-t border-border pt-2 font-display font-bold"><span className="text-foreground">Total</span><span className="text-primary">{naira(order.total_amount)}</span></li>
            </ul>
          </section>
        </main>
      )}
    </div>
  );
};

export default OrderTrackingPage;
