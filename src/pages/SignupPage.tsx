import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload } from "lucide-react";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { nigerianStates } from "@/data/nigerianStates";

const commonFields = [
  { name: "fullName", label: "Full Name", type: "text", placeholder: "John Doe" },
  { name: "email", label: "Email Address", type: "email", placeholder: "john@email.com" },
  { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
  { name: "phone", label: "Phone Number", type: "tel", placeholder: "+234 800 000 0000" },
];

const roleExtras: Record<string, { label: string; fields: { name: string; label: string; type: string; placeholder: string; inputType?: string }[] }> = {
  student: {
    label: "Buyer",
    fields: [
      { name: "city", label: "City / LGA", type: "text", placeholder: "Ikeja" },
    ],
  },
  vendor: {
    label: "Vendor",
    fields: [
      { name: "city", label: "City / LGA", type: "text", placeholder: "Ikeja" },
      { name: "businessName", label: "Business Name", type: "text", placeholder: "Mama's Kitchen" },
      { name: "foodCategory", label: "Food Category", type: "text", placeholder: "Nigerian, Continental" },
      { name: "businessDesc", label: "Business Description", type: "textarea", placeholder: "Tell us about your food business..." },
    ],
  },
  farmer: {
    label: "Farmer",
    fields: [
      { name: "city", label: "City / LGA", type: "text", placeholder: "Abeokuta" },
      { name: "farmType", label: "Farm Type", type: "text", placeholder: "Crop, Livestock, Mixed" },
      { name: "products", label: "Products Produced", type: "text", placeholder: "Tomatoes, Peppers, Rice" },
    ],
  },
  rider: {
    label: "Rider",
    fields: [
      { name: "city", label: "City / LGA", type: "text", placeholder: "Yaba" },
      { name: "vehicleType", label: "Vehicle Type", type: "text", placeholder: "Motorcycle, Bicycle" },
      { name: "license", label: "Driver License", type: "file", placeholder: "Upload license", inputType: "file" },
    ],
  },
};

const SignupPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const config = roleExtras[role || ""];
  if (!config || role === "admin") {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Welcome to BUKKS as a ${config.label}!`);
    navigate(`/dashboard/${role}`);
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
            {/* Common fields */}
            {commonFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">{field.label}</Label>
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="bg-muted/50 border-border font-body"
                  required
                />
              </div>
            ))}

            {/* State dropdown */}
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

            {/* Role-specific fields */}
            {config.fields.map((field) => (
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

            <Button type="submit" className="w-full mt-2 btn-gold py-5 text-base">
              Create Account
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
