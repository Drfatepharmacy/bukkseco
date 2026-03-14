import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Eye, EyeOff } from "lucide-react";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { nigerianStates } from "@/data/nigerianStates";
import { supabase } from "@/integrations/supabase/client";

const roleMap: Record<string, { label: string; dbRole: string }> = {
  student: { label: "Buyer", dbRole: "buyer" },
  vendor: { label: "Vendor", dbRole: "vendor" },
  farmer: { label: "Farmer", dbRole: "farmer" },
  rider: { label: "Rider", dbRole: "rider" },
};

const roleExtras: Record<string, { name: string; label: string; type: string; placeholder: string }[]> = {
  vendor: [
    { name: "businessName", label: "Business Name", type: "text", placeholder: "Mama's Kitchen" },
    { name: "foodCategory", label: "Food Category", type: "text", placeholder: "Nigerian, Continental" },
    { name: "businessDesc", label: "Business Description", type: "textarea", placeholder: "Tell us about your food business..." },
  ],
  farmer: [
    { name: "farmType", label: "Farm Type", type: "text", placeholder: "Crop, Livestock, Mixed" },
    { name: "products", label: "Products Produced", type: "text", placeholder: "Tomatoes, Peppers, Rice" },
  ],
  rider: [
    { name: "vehicleType", label: "Vehicle Type", type: "text", placeholder: "Motorcycle, Bicycle" },
    { name: "license", label: "Driver License", type: "file", placeholder: "Upload license" },
  ],
};

const SignupPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const config = roleMap[role || ""];
  if (!config || role === "admin") {
    navigate("/");
    return null;
  }

  const extraFields = roleExtras[role || ""] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: config.dbRole,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // 2. Update profile with additional fields
      await supabase.from("profiles").update({
        phone: formData.phone || null,
        state: formData.state || null,
        city: formData.city || null,
      }).eq("id", userId);

      // 3. Insert role-specific profile
      if (role === "vendor") {
        await supabase.from("vendor_profiles").insert({
          user_id: userId,
          business_name: formData.businessName,
          food_category: formData.foodCategory || null,
          business_description: formData.businessDesc || null,
        });
      } else if (role === "farmer") {
        await supabase.from("farmer_profiles").insert({
          user_id: userId,
          farm_type: formData.farmType || null,
          products: formData.products || null,
        });
      } else if (role === "rider") {
        await supabase.from("rider_profiles").insert({
          user_id: userId,
          vehicle_type: formData.vehicleType || null,
        });
      }

      if (role === "student") {
        toast.success("Welcome to BUKKS! Your account is ready.");
        navigate(`/dashboard/student`);
      } else {
        toast.success(`Account created! Your ${config.label} account is pending admin approval.`);
        navigate("/login");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
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
            Join as {config.label}
          </h1>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Fill in your details to create your BUKKS account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Full Name</Label>
              <Input
                type="text"
                placeholder="John Doe"
                value={formData.fullName || ""}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-muted/50 border-border font-body"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Email Address</Label>
              <Input
                type="email"
                placeholder="john@email.com"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-muted/50 border-border font-body pr-10"
                  required
                  minLength={6}
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

            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Phone Number</Label>
              <Input
                type="tel"
                placeholder="+234 800 000 0000"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-muted/50 border-border font-body"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">State</Label>
              <select
                required
                className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-body"
                value={formData.state || ""}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              >
                <option value="">Select your state</option>
                {nigerianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">City / LGA</Label>
              <Input
                type="text"
                placeholder="Ikeja"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-muted/50 border-border font-body"
                required
              />
            </div>

            {/* Role-specific fields */}
            {extraFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="bg-muted/50 border-border font-body"
                    rows={3}
                  />
                ) : field.type === "file" ? (
                  <div className="glass-card p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-body">Click to upload {field.label.toLowerCase()}</span>
                  </div>
                ) : (
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="bg-muted/50 border-border font-body"
                    required
                  />
                )}
              </div>
            ))}

            {role === "vendor" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Kitchen Photos</Label>
                <div className="glass-card p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-body">Upload kitchen images</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-2 btn-gold py-5 text-base"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-center text-xs text-muted-foreground font-body mt-4">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-secondary font-semibold hover:underline">
                Log in
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
