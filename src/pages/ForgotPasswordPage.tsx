import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MailCheck } from "lucide-react";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const NEUTRAL =
  "If an account matches these details, recovery instructions have been sent.";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Never reveal whether the address exists — always show the same result.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
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
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-body"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>

          <LogoPlaceholder size="sm" />

          {sent ? (
            <div className="mt-6">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
                <MailCheck className="w-6 h-6 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Check your inbox
              </h1>
              <p className="text-sm text-muted-foreground font-body mb-6">{NEUTRAL}</p>
              <p className="text-xs text-muted-foreground font-body mb-6">
                The link expires shortly and can only be used once. Didn't get it?
                Check spam, then try again.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 font-body" onClick={() => setSent(false)}>
                  Try again
                </Button>
                <Button className="flex-1 btn-gold" onClick={() => navigate("/login")}>
                  Back to login
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground mt-4 mb-1">
                Recover your account
              </h1>
              <p className="text-sm text-muted-foreground font-body mb-6">
                Enter the email you signed up with and we'll send a recovery link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-body text-muted-foreground">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="john@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted/50 border-border font-body"
                    required
                  />
                </div>

                <Button type="submit" className="w-full mt-2 btn-gold py-5 text-base" disabled={loading}>
                  {loading ? "Sending..." : "Send recovery link"}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
