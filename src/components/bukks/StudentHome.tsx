import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, PackageSearch, ChevronRight, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OrderSkeleton, EmptyState } from "@/components/bukks/Skeletons";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment confirmation",
  confirmed: "Vendor accepted",
  preparing: "Being prepared",
  rider_assigned: "Rider assigned",
  out_for_delivery: "On the way",
};
const STAGES = ["pending", "confirmed", "preparing", "rider_assigned", "out_for_delivery", "delivered"];

const naira = (n: number) => `₦${Math.round(Number(n) || 0).toLocaleString("en-NG")}`;

const StudentHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const { data: activeOrder, isLoading: orderLoading } = useQuery({
    queryKey: ["student-active-order", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,status,total_amount,payment_status")
        .eq("buyer_id", user!.id)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    refetchInterval: 20000,
  });

  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ["home-meals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("meals")
        .select("id,name,price,category,image_url,stock_quantity")
        .eq("is_available", true)
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .limit(40);
      return data ?? [];
    },
  });

  const categories = Array.from(new Set(meals.map((m) => m.category).filter(Boolean))) as string[];
  const shown = meals.filter((m) => (!cat || m.category === cat) && (m.stock_quantity ?? 1) > 0);
  const affordable = [...shown].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 8);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/app/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  const stage = Math.max(0, STAGES.indexOf(activeOrder?.status || "pending"));

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-body text-foreground"
      >
        <MapPin className="h-4 w-4 text-primary" />
        UNIBEN · Ugbowo campus
      </button>

      <form onSubmit={submitSearch} role="search">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search meals or vendors"
            aria-label="Search meals or vendors"
            className="flex-1 bg-transparent font-body text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
      </form>

      {activeOrder && (
        <button
          onClick={() => navigate("/app/orders")}
          className="w-full rounded-2xl border border-primary/40 bg-card p-4 text-left"
        >
          {orderLoading ? (
            <OrderSkeleton />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-muted-foreground">{activeOrder.order_number}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-1 font-display text-lg font-semibold text-foreground">
                {STATUS_LABEL[activeOrder.status] ?? activeOrder.status}
              </p>
              <div className="mt-3 flex gap-1">
                {STAGES.slice(0, 5).map((s, i) => (
                  <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= stage ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
              <p className="mt-2 font-body text-sm text-muted-foreground">{naira(activeOrder.total_amount)}</p>
            </>
          )}
        </button>
      )}

      {categories.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              onClick={() => setCat(c)}
              className={`min-h-10 shrink-0 rounded-full px-4 font-body text-sm font-medium ${
                cat === c ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
              }`}
            >
              {c ?? "All"}
            </button>
          ))}
        </div>
      )}

      <section aria-label="Affordable meals">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Affordable today</h2>
          <button onClick={() => navigate("/app/explore")} className="min-h-10 font-body text-sm font-semibold text-primary">
            See all
          </button>
        </div>

        {mealsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : affordable.length === 0 ? (
          <EmptyState icon={PackageSearch} title="No meals available right now" hint="Vendors haven't listed meals yet. Check back soon." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {affordable.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/app/explore?q=${encodeURIComponent(m.name)}`)}
                className="overflow-hidden rounded-2xl border border-border bg-card text-left"
              >
                <div className="aspect-square bg-muted">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 font-body text-sm font-semibold text-foreground">{m.name}</p>
                  <p className="mt-0.5 font-display text-base font-bold text-primary">{naira(Number(m.price))}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentHome;
