import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type State = "checking" | "ready" | "invalid" | "done";

export const passwordIssues = (pw: string) => {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("at least 8 characters");
  if (!/[A-Za-z]/.test(pw)) issues.push("a letter");
  if (!/[0-9]/.test(pw)) issues.push("a number");
  return issues;
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("error")) {
      setState("invalid");
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setState((s) => (s === "done" ? s : "ready"));
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => {
        if (s === "done" || s === "ready") return s;
        return session ? "ready" : "invalid";
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const issues = useMemo(() => passwordIssues(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (issues.length) {
      toast.error(`Password needs ${issues.join(", ")}.`);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSaving(true);

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSaving(false);
      if (/expired|invalid|not found/i.test(error.message)) {
        setState("invalid");
        return;
      }
      toast.error(error.message);
      return;
    }

    // Audit trail — best effort, never blocks the reset.
    try {
      await (supabase.from("event_logs") as any).insert({
        event_type: "password_reset_completed",
        actor_id: data.user?.id ?? null,
        target_type: "auth_user",
        target_id: data.user?.id ?? null,
      });
    } catch {
      /* ignore */
    }

    // Invalidate every other active session for this account.
    try {
      await supabase.auth.signOut({ scope: "others" } as any);
    } catch {
      /* ignore */
    }

    setSaving(false);
    setState("done");
  };

  const finish = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="geo-card p-8">
          <LogoPlaceholder size="sm" />

          {state === "checking" && (
            <p className="text-sm text-muted-foreground font-body mt-6">Checking your recovery link...</p>
          )}

          {state === "invalid" && (
            <div className="mt-6">
              <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                This link no longer works
              </h1>
              <p className="text-sm text-muted-foreground font-body mb-6">
                Recovery links expire and can only be used once. Request a fresh one to continue.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1 btn-gold" onClick={() => navigate("/forgot-password")}>
                  Request new link
                </Button>
                <Button variant="outline" className="flex-1 font-body" onClick={() => navigate("/login")}>
                  Back to login
                </Button>
              </div>
            </div>
          )}

          {state === "done" && (
            <div className="mt-6">
              <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Password updated</h1>
              <p className="text-sm text-muted-foreground font-body mb-6">
                You've been signed out everywhere else. Log in with your new password.
              </p>
              <Button className="w-full btn-gold" onClick={finish}>
                Go to login
              </Button>
            </div>
          )}

          {state === "ready" && (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground mt-4 mb-1">
                Set a new password
              </h1>
              <p className="text-sm text-muted-foreground font-body mb-6">
                Choose something you haven't used elsewhere.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-body text-muted-foreground">New password</Label>
                  <div className="relative">
                    <Input
                      type={show ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-muted/50 border-border font-body pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && issues.length > 0 && (
                    <p className="text-xs text-destructive font-body">Needs {issues.join(", ")}.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-body text-muted-foreground">Confirm password</Label>
                  <Input
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="bg-muted/50 border-border font-body"
                    required
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-destructive font-body">Passwords don't match.</p>
                  )}
                </div>

                <Button type="submit" className="w-full mt-2 btn-gold py-5 text-base" disabled={saving}>
                  {saving ? "Updating..." : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
