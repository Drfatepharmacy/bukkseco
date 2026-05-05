import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wallet, Coins, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WalletRow { id: string; balance: number; currency: string; status: string; }
interface Tx {
  id: string; type: string; amount: number; balance_after: number;
  reference: string; created_at: string; metadata: any; related_paystack_ref: string | null;
}

const KPI = ({ title, value, icon: Icon, tone }: { title: string; value: string; icon: any; tone: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="glass-card p-4 flex items-center gap-3"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{title}</p>
      <p className="font-display text-xl font-bold text-foreground truncate">{value}</p>
    </div>
  </motion.div>
);

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const WalletPanel = () => {
  const { user } = useAuth();
  const [topupOpen, setTopupOpen] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [topupBusy, setTopupBusy] = useState(false);

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("*").eq("user_id", user!.id).maybeSingle();
      return data as WalletRow | null;
    },
    enabled: !!user,
  });

  const { data: txs = [], refetch: refetchTxs } = useQuery({
    queryKey: ["wallet-txs", wallet?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data as Tx[]) || [];
    },
    enabled: !!wallet?.id,
  });

  // Realtime updates
  useEffect(() => {
    if (!wallet?.id) return;
    const ch = supabase
      .channel(`wallet-${wallet.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_transactions", filter: `wallet_id=eq.${wallet.id}` },
        () => { refetchTxs(); refetchWallet(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "wallets", filter: `id=eq.${wallet.id}` },
        () => refetchWallet())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [wallet?.id, refetchTxs, refetchWallet]);

  const { funded, spent } = useMemo(() => {
    let f = 0, s = 0;
    txs.forEach(t => {
      if (t.type === "deposit" || t.type === "credit") f += Number(t.amount);
      if (t.type === "debit") s += Number(t.amount);
    });
    return { funded: f, spent: s };
  }, [txs]);

  const handleTopUp = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error("Minimum top-up is ₦100"); return; }
    setTopupBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("wallet-topup", {
        body: { action: "initialize", amount: amt },
      });
      if (error) throw error;
      if (!data?.authorization_url) throw new Error("No payment URL returned");

      // Open Paystack hosted page
      const popup = window.open(data.authorization_url, "_blank", "width=480,height=720");
      const reference = data.reference;
      toast.success("Complete payment in the new window");

      // Poll verify every 4s for up to 4 min
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data: v } = await supabase.functions.invoke("wallet-topup", {
          body: { action: "verify", reference },
        });
        if (v?.status === "success" || v?.status === "already_credited") {
          clearInterval(poll);
          toast.success(`Wallet credited! New balance: ${fmt(v.balance ?? 0)}`);
          refetchWallet(); refetchTxs();
          try { popup?.close(); } catch {}
        }
        if (attempts > 60) clearInterval(poll);
      }, 4000);
    } catch (err: any) {
      toast.error(err.message || "Top-up failed");
    } finally {
      setTopupBusy(false);
      setTopupOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPI title="Wallet Balance" value={fmt(wallet?.balance || 0)} icon={Wallet} tone="bg-primary/15 text-primary" />
        <KPI title="Total Funded" value={fmt(funded)} icon={TrendingUp} tone="bg-success/15 text-success" />
        <KPI title="Spent" value={fmt(spent)} icon={Coins} tone="bg-destructive/15 text-destructive" />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setTopupOpen(true)} className="btn-gold">
          <Plus className="w-4 h-4 mr-1" /> Top up wallet
        </Button>
      </div>

      {/* Transactions */}
      <div className="glass-card p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">Transactions</h3>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body py-6 text-center">
            No transactions yet. Top up your wallet to get started.
          </p>
        ) : (
          <ScrollArea className="h-[420px] pr-2">
            <div className="space-y-2">
              {txs.map(t => {
                const isCredit = t.type === "deposit" || t.type === "credit";
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isCredit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-foreground truncate">
                        {t.metadata?.description || (isCredit ? "Wallet credit" : "Wallet debit")}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-body">
                        {new Date(t.created_at).toLocaleString()} · <span className="opacity-70">{t.reference}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-display font-bold ${isCredit ? "text-success" : "text-destructive"}`}>
                        {isCredit ? "+" : "-"}{fmt(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-body">bal {fmt(t.balance_after)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Top up wallet</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              type="number" min={100} value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount in ₦"
            />
            <div className="flex gap-2 flex-wrap">
              {[1000, 2000, 5000, 10000].map(v => (
                <Badge key={v} variant="outline" className="cursor-pointer" onClick={() => setAmount(String(v))}>
                  ₦{v.toLocaleString()}
                </Badge>
              ))}
            </div>
            <Button onClick={handleTopUp} disabled={topupBusy} className="w-full btn-gold">
              {topupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ₦${Number(amount || 0).toLocaleString()}`}
            </Button>
            <p className="text-[10px] text-muted-foreground font-body text-center">
              Secure payment by Paystack
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPanel;
