import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  History,
  CreditCard,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Coins,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/ui/kpi-card";

const WalletPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [topupOpen, setTopupOpen] = useState(false);
  const [amount, setAmount] = useState<string>("1000");
  const [submitting, setSubmitting] = useState(false);

  // Verify Paystack reference on return from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference || !user) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("wallet-topup", {
        body: { action: "verify", reference },
      });
      if (error || data?.status === "failed") {
        toast.error("Top-up failed", { description: data?.message || error?.message });
      } else {
        toast.success("Wallet credited", { description: `New balance ₦${Number(data?.balance || 0).toLocaleString()}` });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
      window.history.replaceState({}, "", "/wallet");
    })();
  }, [user, queryClient]);

  const handleTopup = async () => {
    const ngn = Number(amount);
    if (!ngn || ngn < 100) {
      toast.error("Minimum top-up is ₦100");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("wallet-topup", {
      body: { action: "initialize", amount: ngn },
    });
    setSubmitting(false);
    if (error || !data?.authorization_url) {
      toast.error("Could not start payment", { description: error?.message || data?.error });
      return;
    }
    window.location.href = data.authorization_url;
  };

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions, isLoading: transLoading } = useQuery({
    queryKey: ["transactions", wallet?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet?.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!wallet,
  });

  return (
    <div className="container px-6 py-12 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Wallet</h1>
          <p className="text-muted-foreground font-body">Manage your funds and rewards effortlessly.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-success/10 text-success rounded-full px-4 py-1.5 border border-success/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Secure Encrypted</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Wallet className="w-64 h-64" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8 opacity-60">
                 <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                 <span className="text-xs font-bold uppercase tracking-widest">Available Balance</span>
              </div>

              <div className="flex items-baseline gap-2 mb-12">
                <span className="text-4xl md:text-5xl opacity-40 font-light font-display">₦</span>
                <span className="text-6xl md:text-8xl font-bold tracking-tighter">
                  {walletLoading ? "..." : Number(wallet?.balance || 0).toLocaleString()}
                </span>
                <span className="text-2xl opacity-40 font-body">.00</span>
              </div>

              <div className="flex flex-wrap gap-4">
                 <button onClick={() => setTopupOpen(true)} className="btn-gold px-10 h-16 text-lg flex items-center gap-2">
                   <Plus className="w-5 h-5" />
                   Add Money
                 </button>
                 <button
                   onClick={() => toast.info("Wallet-to-wallet transfer launching soon")}
                   className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-xl px-10 h-16 text-lg transition-all"
                 >
                   Transfer
                 </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions / Rewards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="premium-card p-8 flex items-center gap-6 group cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-xl mb-1">Mobile Top-up</h4>
                <p className="text-muted-foreground text-sm">Airtime & Data instantly</p>
              </div>
              <ChevronRight className="w-6 h-6 ml-auto opacity-20" />
            </div>

            <div className="premium-card p-8 flex items-center gap-6 group cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-xl mb-1">Cashback</h4>
                <p className="text-muted-foreground text-sm">You've earned ₦2,400</p>
              </div>
              <ChevronRight className="w-6 h-6 ml-auto opacity-20" />
            </div>
          </div>

          {/* Transactions List */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold tracking-tight">Recent Activity</h3>
              <Button variant="link" className="text-primary font-bold">See all</Button>
            </div>

            <div className="space-y-4">
              {transLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
              ) : transactions.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-[2rem] border-2 border-dashed">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground font-body">No transactions yet.</p>
                </div>
              ) : (
                transactions.map((t: any) => (
                  <div key={t.id} className="premium-card p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        t.type === 'deposit' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {t.type === 'deposit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <h5 className="font-bold capitalize">{t.metadata?.description || t.type}</h5>
                        <p className="text-sm text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${
                        t.type === 'deposit' ? 'text-success' : 'text-foreground'
                      }`}>
                        {t.type === 'deposit' ? '+' : '-'} ₦{Number(t.amount).toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest font-bold opacity-30">{t.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Info */}
        <div className="space-y-8">
          <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10">
            <h4 className="font-bold text-xl mb-6">Why use Bukks Wallet?</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground text-xs font-bold">1</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Zero transaction fees on all campus orders.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground text-xs font-bold">2</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Faster checkout with 1-click payments.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground text-xs font-bold">3</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Exclusive rewards and early access to group buys.</p>
              </li>
            </ul>
          </div>

          <div className="premium-card p-8 bg-gradient-to-br from-secondary to-purple text-white border-none">
             <h4 className="font-bold text-xl mb-2">Invite Friends</h4>
             <p className="text-white/60 text-sm mb-6">Earn ₦500 for every friend who funds their wallet.</p>
             <button className="w-full h-12 bg-white text-secondary font-bold rounded-xl hover:bg-white/90 transition-all">
               Copy Referral Code
             </button>
          </div>
        </div>
      </div>

      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add money to your wallet</DialogTitle>
            <DialogDescription>
              Securely funded via Paystack. Funds appear instantly after payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="topup-amount">Amount (₦)</Label>
              <Input
                id="topup-amount"
                type="number"
                min={100}
                step={100}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000, 5000, 10000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition"
                >
                  ₦{v.toLocaleString()}
                </button>
              ))}
            </div>
            <Button onClick={handleTopup} disabled={submitting} className="w-full h-12">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ₦${Number(amount || 0).toLocaleString()}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;
