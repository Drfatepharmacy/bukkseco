import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { passwordIssues } from "@/pages/ResetPasswordPage";

const ChangePasswordCard = () => {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issues = passwordIssues(next);
    if (issues.length) return toast.error(`Password needs ${issues.join(", ")}.`);
    if (next !== confirm) return toast.error("Passwords don't match.");
    if (!user?.email) return toast.error("No account email on file.");

    setSaving(true);
    // Re-authenticate before allowing the change.
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (authError) {
      setSaving(false);
      return toast.error("Current password is incorrect.");
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) return toast.error(error.message);

    try {
      await (supabase.from("event_logs") as any).insert({
        event_type: "password_changed",
        actor_id: user.id,
        target_type: "auth_user",
        target_id: user.id,
      });
    } catch {
      /* ignore */
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated.");
  };

  return (
    <div className="geo-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-4 h-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">Security</h3>
      </div>
      <p className="text-xs text-muted-foreground font-body mb-4">
        Change your password. You'll need your current one to confirm it's you.
      </p>

      <form onSubmit={submit} className="space-y-3 max-w-md">
        <div className="space-y-1.5">
          <Label className="text-xs font-body text-muted-foreground">Current password</Label>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="bg-muted/50 border-border font-body"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-body text-muted-foreground">New password</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
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
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-body text-muted-foreground">Confirm new password</Label>
          <Input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="bg-muted/50 border-border font-body"
            required
          />
        </div>
        <Button type="submit" className="btn-gold" disabled={saving}>
          {saving ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordCard;
