import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type State = "validating" | "ready" | "invalid" | "saving" | "done";

export const passwordIssues = (pw: string) => {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("at least 8 characters");
  if (!/[A-Za-z]/.test(pw)) issues.push("a letter");
  if (!/[0-9]/.test(pw)) issues.push("a number");
  return issues;
};

/** Strips recovery params from the address bar without a navigation. */
const scrubUrl = () => {
  window.history.replaceState({}, "", window.location.pathname);
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { beginRecovery, endRecovery } = useAuth();
  const [state, setState] = useState<State>("validating");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const submitting = useRef(false);

  // ---- Step 1: validate / exchange the recovery credentials ------------------
  useEffect(() => {
    let cancelled = false;
    beginRecovery();

    const validate = async () => {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      if (search.get("error") || hash.get("error")) {
        console.warn("[recovery] callback returned an error state");
        if (!cancelled) setState("invalid");
        return;
      }

      const code = search.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        scrubUrl();
        if (error) {
          console.warn("[recovery] code exchange failed");
          if (!cancelled) setState("invalid");
          return;
        }
        if (!cancelled) setState("ready");
        return;
      }

      // Implicit flow: supabase-js consumes the hash tokens itself.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        scrubUrl();
        if (!cancelled) setState("ready");
        return;
      }

      // Give the client a moment to process the hash, then decide.
      setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (cancelled) return;
        if (retry.session) {
          scrubUrl();
          setState("ready");
        } else {
          setState("invalid");
        }
      }, 900);
    };

    validate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issues = useMemo(() => passwordIssues(password), [password]);

  // ---- Step 2: update the password using the recovery session ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current || state !== "ready") return;

    if (issues.length) {
      setFormError(`Password needs ${issues.join(", ")}.`);
      return;
    }
    if (password !== confirm) {
      setFormError("Both passwords must match.");
      return;
    }

    submitting.current = true;
    setFormError(null);
    setState("saving");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      submitting.current = false;
      console.warn("[recovery] password update rejected");
      if (/expired|invalid|session|not found|jwt/i.test(error.message)) {
        setState("invalid");
        return;
      }
      setState("ready");
      setFormError("We couldn't update your password. Please try again.");
      return;
    }

    // Step 3: terminate every session, including this recovery session.
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      /* ignore */
    }

    endRecovery();
    scrubUrl();
    submitting.current = false;
    setState("done");

    setTimeout(() => navigate("/login?passwordReset=success", { replace: true }), 1600);
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="geo-card p-8">
          <LogoPlaceholder size="sm" />
          {children}
        </div>
      </motion.div>
    </div>
  );

  if (state === "validating") {
    return shell(
      <div className="mt-6 flex flex-col items-center gap-4 py-6" role="status" aria-live="polite">
        <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-body">Verifying your recovery link…</p>
      </div>
    );
  }

  if (state === "invalid") {
    return shell(
      <div className="mt-6" role="alert">
        <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          This reset link is invalid or has expired.
        </h1>
        <p className="text-sm text-muted-foreground font-body mb-6">
          Recovery links can only be used once and expire quickly. Request a fresh one to continue.
        </p>
        <div className="flex gap-3">
          <Button
            className="flex-1 btn-gold"
            onClick={() => {
              endRecovery();
              navigate("/forgot-password", { replace: true });
            }}
          >
            Request another reset link
          </Button>
          <Button
            variant="outline"
            className="flex-1 font-body"
            onClick={() => {
              endRecovery();
              navigate("/login", { replace: true });
            }}
          >
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return shell(
      <div className="mt-6" role="status" aria-live="polite">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Password updated</h1>
        <p className="text-sm text-muted-foreground font-body mb-6">
          All active sessions were signed out for your security. Log in with your new password.
        </p>
        <Button
          className="w-full btn-gold"
          onClick={() => navigate("/login?passwordReset=success", { replace: true })}
        >
          Go to login
        </Button>
      </div>
    );
  }

  const saving = state === "saving";

  return shell(
    <>
      <h1 className="font-display text-2xl font-bold text-foreground mt-4 mb-1">
        Create new password
      </h1>
      <p className="text-sm text-muted-foreground font-body mb-6">
        Choose a password you haven't used on Bukks before.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-sm font-body text-muted-foreground">
            New password
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted/50 border-border font-body pr-10"
              aria-describedby="password-requirements"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p id="password-requirements" className="text-xs text-muted-foreground font-body">
            Must be at least 8 characters and include a letter and a number.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-sm font-body text-muted-foreground">
            Confirm new password
          </Label>
          <Input
            id="confirm-password"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="bg-muted/50 border-border font-body"
            autoComplete="new-password"
            required
          />
        </div>

        {formError && (
          <p role="alert" className="text-xs font-body text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full mt-2 btn-gold py-5 text-base" disabled={saving}>
          {saving ? "Updating password…" : "Update password"}
        </Button>
      </form>
    </>
  );
};

export default ResetPasswordPage;
