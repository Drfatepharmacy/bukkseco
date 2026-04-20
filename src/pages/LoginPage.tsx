import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Fetch user role to redirect to correct dashboard
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      const role = roleData?.role || "student";

      if (role === "super_admin") {
        toast.success("Welcome back, Founder!");
        navigate("/dashboard/super_admin");
        return;
      }

      // Map 'buyer' role to 'student' route for dashboard
      const dashboardRole = (role === "buyer" || role === "user") ? "student" : role;
      toast.success("Welcome back to BUKKS!");
      navigate(`/dashboard/${dashboardRole}`);
    }

    setLoading(false);
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
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-body"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <LogoPlaceholder size="sm" />

          <h1 className="font-display text-2xl font-bold text-foreground mt-4 mb-1">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Log in to your BUKKS account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/50 border-border font-body pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 btn-gold py-5 text-base"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Log In"}
            </Button>

            <p className="text-center text-xs text-muted-foreground font-body mt-4">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-secondary font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
