import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock, Store, Sprout, Bike, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PendingAccount {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: "vendor" | "farmer" | "rider";
  created_at: string;
  extra: string;
}

const roleIcons = { vendor: Store, farmer: Sprout, rider: Bike };
const roleBadgeColors = {
  vendor: "bg-primary/10 text-primary",
  farmer: "bg-success/10 text-success",
  rider: "bg-secondary/10 text-secondary",
};

const profileTables = {
  vendor: "vendor_profiles",
  farmer: "farmer_profiles",
  rider: "rider_profiles",
} as const;

interface AdminApprovalsProps {
  filterRole?: "vendor" | "farmer" | "rider";
}

const AdminApprovals = ({ filterRole }: AdminApprovalsProps) => {
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const rolesToFetch = filterRole ? [filterRole] : (["vendor", "farmer", "rider"] as const);
    const all: PendingAccount[] = [];

    for (const r of rolesToFetch) {
      const table = profileTables[r];
      const { data, error } = await supabase
        .from(table)
        .select("id, user_id, created_at, is_approved" + (r === "vendor" ? ", business_name, food_category" : r === "farmer" ? ", farm_type, products" : ", vehicle_type"))
        .eq("is_approved", false);

      if (error) {
        console.error(`Error fetching ${r}:`, error);
        continue;
      }

      if (!data || data.length === 0) continue;

      // Fetch profile info for each user
      const userIds = data.map((d: any) => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      for (const item of data as any[]) {
        const profile = profileMap.get(item.user_id);
        all.push({
          id: item.id,
          user_id: item.user_id,
          name: r === "vendor" ? item.business_name : (profile?.full_name || "Unknown"),
          email: profile?.email || "",
          role: r,
          created_at: item.created_at,
          extra: r === "vendor" ? (item.food_category || "") : r === "farmer" ? (item.farm_type || "") : (item.vehicle_type || ""),
        });
      }
    }

    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAccounts(all);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, [filterRole]);

  const handleAction = async (account: PendingAccount, approve: boolean) => {
    setProcessing(account.id);
    const table = profileTables[account.role];

    // Update role-specific profile
    const { error: profileError } = await supabase
      .from(table)
      .update({ is_approved: approve } as any)
      .eq("id", account.id);

    if (profileError) {
      toast({ title: "Error", description: profileError.message, variant: "destructive" });
      setProcessing(null);
      return;
    }

    // Update main profile approval if approving
    if (approve) {
      await supabase.from("profiles").update({ is_approved: true }).eq("id", account.user_id);
    }

    toast({
      title: approve ? "Approved ✓" : "Rejected",
      description: `${account.name} has been ${approve ? "approved" : "rejected"}.`,
    });

    setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    setProcessing(null);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground">
            Pending {filterRole ? `${filterRole.charAt(0).toUpperCase() + filterRole.slice(1)}` : ""} Approvals ({accounts.length})
          </h3>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {accounts.map((account) => {
              const Icon = roleIcons[account.role];
              return (
                <motion.div
                  key={account.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${roleBadgeColors[account.role]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-body font-medium text-foreground">{account.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {account.email} · {timeAgo(account.created_at)}
                        {account.extra && ` · ${account.extra}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${roleBadgeColors[account.role]}`}>
                      {account.role}
                    </span>
                    <button
                      disabled={processing === account.id}
                      onClick={() => handleAction(account, true)}
                      className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                    >
                      {processing === account.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={processing === account.id}
                      onClick={() => handleAction(account, false)}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground font-body text-center py-4">
              No pending {filterRole || ""} approvals ✓
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApprovals;
