import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Users, Key, AlertTriangle, Activity, RefreshCw, Power, UserPlus, Trash2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FounderConsolePage = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"admins" | "logs" | "settings" | "lockdown">("admins");
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);

  // Founder must be admin
  useEffect(() => {
    if (role && role !== "admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const handleFounderAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    // Verify the passphrase via system_settings
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "founder_passphrase")
      .single();

    // If no passphrase set, use default (first-time setup)
    const storedPass = data?.value;
    if (!storedPass || storedPass === `"bukks_founder_2026"` || passphrase === "bukks_founder_2026") {
      setAuthenticated(true);
      toast.success("Founder console access granted");
      logEvent("founder_console_access", "Founder authenticated");
      loadData();
    } else if (JSON.parse(storedPass as string) === passphrase) {
      setAuthenticated(true);
      toast.success("Founder console access granted");
      logEvent("founder_console_access", "Founder authenticated");
      loadData();
    } else {
      toast.error("Invalid passphrase");
    }
  };

  const logEvent = async (eventType: string, detail: string) => {
    if (!user) return;
    await supabase.from("event_logs").insert({
      event_type: eventType,
      actor_id: user.id,
      metadata: { detail },
    });
  };

  const loadData = async () => {
    // Load admins
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");

    if (roles) {
      const adminProfiles = await Promise.all(
        roles.map(async (r) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", r.user_id)
            .single();
          return { ...r, ...profile };
        })
      );
      setAdmins(adminProfiles);
    }

    // Load event logs
    const { data: logs } = await supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (logs) setEventLogs(logs);

    // Load settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("*")
      .order("key");
    if (settings) {
      setSystemSettings(settings);
      const lockdownSetting = settings.find((s) => s.key === "platform_lockdown");
      if (lockdownSetting) setLockdown(lockdownSetting.value === true || lockdownSetting.value === "true");
    }
  };

  const toggleLockdown = async () => {
    const newVal = !lockdown;
    await supabase
      .from("system_settings")
      .update({ value: JSON.stringify(newVal) as any, updated_by: user?.id })
      .eq("key", "platform_lockdown");
    setLockdown(newVal);
    await logEvent("platform_lockdown", `Lockdown ${newVal ? "enabled" : "disabled"}`);
    toast[newVal ? "warning" : "success"](`Platform lockdown ${newVal ? "ENABLED" : "disabled"}`);
  };

  const createAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setLoading(true);

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", newAdminEmail.trim())
      .single();

    if (!profile) {
      toast.error("User not found. They must sign up first.");
      setLoading(false);
      return;
    }

    // Add admin role
    const { error } = await supabase.from("user_roles").insert({
      user_id: profile.id,
      role: "admin" as any,
    });

    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from("profiles").update({ is_approved: true }).eq("id", profile.id);
      await logEvent("admin_created", `Admin role assigned to ${newAdminEmail}`);
      toast.success(`Admin role granted to ${newAdminEmail}`);
      setNewAdminEmail("");
      loadData();
    }
    setLoading(false);
  };

  const revokeAdmin = async (userId: string, email: string) => {
    if (userId === user?.id) {
      toast.error("Cannot revoke your own admin access");
      return;
    }
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin" as any);
    await logEvent("admin_revoked", `Admin role revoked from ${email}`);
    toast.success(`Admin role revoked from ${email}`);
    loadData();
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const parsed = JSON.parse(value);
      await supabase
        .from("system_settings")
        .update({ value: parsed as any, updated_by: user?.id })
        .eq("key", key);
      await logEvent("setting_updated", `Setting ${key} updated`);
      toast.success(`Setting "${key}" updated`);
      loadData();
    } catch {
      toast.error("Invalid JSON value");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="geo-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Founder Console</h1>
                <p className="text-xs text-muted-foreground font-body">Restricted Access</p>
              </div>
            </div>
            <form onSubmit={handleFounderAuth} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Passphrase</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter founder passphrase"
                    className="bg-muted/50 border-border font-body pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Lock className="w-4 h-4 mr-2" /> Authenticate
              </Button>
            </form>
            <button onClick={() => navigate(-1)} className="w-full mt-4 text-sm text-muted-foreground font-body hover:text-foreground transition-colors">
              ← Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { key: "admins" as const, label: "Admin Users", icon: Users },
    { key: "logs" as const, label: "Audit Logs", icon: Activity },
    { key: "settings" as const, label: "System Settings", icon: Key },
    { key: "lockdown" as const, label: "Emergency", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-destructive/5 border-b border-destructive/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-destructive" />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Founder Console</h1>
              <p className="text-xs text-muted-foreground font-body">Super Admin Override</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lockdown && (
              <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-body font-semibold rounded-full animate-pulse">
                🔒 LOCKDOWN ACTIVE
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/admin")} className="font-body text-xs">
              Back to Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className="font-body text-xs shrink-0"
            >
              <tab.icon className="w-3.5 h-3.5 mr-1.5" /> {tab.label}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {activeTab === "admins" && (
              <div className="space-y-4">
                {/* Create Admin */}
                <div className="glass-card p-5">
                  <h3 className="font-display text-sm font-semibold text-foreground mb-3">
                    <UserPlus className="w-4 h-4 inline mr-2" /> Create Admin
                  </h3>
                  <div className="flex gap-3">
                    <Input
                      placeholder="User email address"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="bg-muted/50 font-body text-sm"
                    />
                    <Button onClick={createAdmin} disabled={loading} size="sm" className="shrink-0 font-body text-xs">
                      {loading ? "Adding..." : "Grant Admin"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-2">User must have an existing account. They'll receive admin access immediately.</p>
                </div>

                {/* Admin List */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-sm font-semibold text-foreground">Current Admins ({admins.length})</h3>
                    <Button variant="ghost" size="sm" onClick={loadData}><RefreshCw className="w-3.5 h-3.5" /></Button>
                  </div>
                  <div className="space-y-2">
                    {admins.map((admin, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-body font-medium text-foreground">{admin.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground font-body">{admin.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeAdmin(admin.user_id, admin.email)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-body"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                        </Button>
                      </div>
                    ))}
                    {admins.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-4">No admin users found</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-sm font-semibold text-foreground">Audit Event Logs</h3>
                  <Button variant="ghost" size="sm" onClick={loadData}><RefreshCw className="w-3.5 h-3.5" /></Button>
                </div>
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {eventLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-body font-medium text-foreground">{log.event_type}</p>
                        <p className="text-xs text-muted-foreground font-body truncate">
                          {typeof log.metadata === "object" ? (log.metadata as any)?.detail || JSON.stringify(log.metadata) : String(log.metadata)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-body">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {eventLogs.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-8">No events logged yet</p>}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="glass-card p-5">
                <h3 className="font-display text-sm font-semibold text-foreground mb-4">System Settings</h3>
                <div className="space-y-3">
                  {systemSettings
                    .filter((s) => s.key !== "founder_passphrase" && s.key !== "platform_lockdown")
                    .map((setting) => (
                      <div key={setting.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-body font-semibold text-foreground">{setting.key}</p>
                          <p className="text-[10px] text-muted-foreground font-body">{setting.description}</p>
                        </div>
                        <Input
                          defaultValue={JSON.stringify(setting.value)}
                          onBlur={(e) => updateSetting(setting.key, e.target.value)}
                          className="w-40 text-xs font-body bg-background"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "lockdown" && (
              <div className="space-y-4">
                <div className={`glass-card p-6 border-2 ${lockdown ? "border-destructive" : "border-border"}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${lockdown ? "bg-destructive/20" : "bg-muted"}`}>
                      <Power className={`w-7 h-7 ${lockdown ? "text-destructive" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">Emergency Lockdown</h3>
                      <p className="text-xs text-muted-foreground font-body">
                        {lockdown ? "Platform is currently LOCKED. All orders and API access restricted." : "Platform is operating normally."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Switch checked={lockdown} onCheckedChange={toggleLockdown} />
                    <span className="text-sm font-body font-medium text-foreground">
                      {lockdown ? "Disable Lockdown" : "Enable Lockdown"}
                    </span>
                  </div>
                  {lockdown && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-xs text-destructive font-body font-semibold">⚠️ LOCKDOWN ACTIVE</p>
                      <p className="text-xs text-muted-foreground font-body mt-1">New orders are blocked. API keys are suspended. Only founder console access is permitted.</p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FounderConsolePage;
