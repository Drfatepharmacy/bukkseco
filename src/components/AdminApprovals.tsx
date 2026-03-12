import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock, Store, Sprout, Bike, User } from "lucide-react";

interface PendingAccount {
  id: string;
  name: string;
  role: "vendor" | "farmer" | "rider";
  email: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

const roleIcons = { vendor: Store, farmer: Sprout, rider: Bike };
const roleBadgeColors = {
  vendor: "bg-primary/10 text-primary",
  farmer: "bg-success/10 text-success",
  rider: "bg-secondary/10 text-secondary",
};

const initialAccounts: PendingAccount[] = [
  { id: "1", name: "Mama's Kitchen", role: "vendor", email: "mama@email.com", date: "2 hours ago", status: "pending" },
  { id: "2", name: "Green Valley Farm", role: "farmer", email: "green@email.com", date: "5 hours ago", status: "pending" },
  { id: "3", name: "Speed Rider", role: "rider", email: "speed@email.com", date: "1 day ago", status: "pending" },
  { id: "4", name: "Iya Basira Foods", role: "vendor", email: "basira@email.com", date: "1 day ago", status: "pending" },
  { id: "5", name: "Organic Fields", role: "farmer", email: "organic@email.com", date: "2 days ago", status: "pending" },
];

const AdminApprovals = () => {
  const [accounts, setAccounts] = useState(initialAccounts);

  const updateStatus = (id: string, status: "approved" | "rejected") => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const pending = accounts.filter((a) => a.status === "pending");
  const processed = accounts.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground">
            Pending Approvals ({pending.length})
          </h3>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {pending.map((account) => {
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
                      <p className="text-xs text-muted-foreground font-body">{account.email} · {account.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${roleBadgeColors[account.role]}`}>
                      {account.role}
                    </span>
                    <button
                      onClick={() => updateStatus(account.id, "approved")}
                      className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(account.id, "rejected")}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {pending.length === 0 && (
            <p className="text-sm text-muted-foreground font-body text-center py-4">All accounts have been reviewed ✓</p>
          )}
        </div>
      </div>

      {/* Processed */}
      {processed.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Recently Processed</h3>
          <div className="space-y-2">
            {processed.map((account) => {
              const Icon = roleIcons[account.role];
              return (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-body text-foreground">{account.name}</span>
                  </div>
                  <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${
                    account.status === "approved"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {account.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
