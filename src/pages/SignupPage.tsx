import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload } from "lucide-react";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const roleFields: Record<string, { label: string; fields: { name: string; label: string; type: string; placeholder: string }[] }> = {
  student: {
    label: "Student",
    fields: [
      { name: "fullName", label: "Full Name", type: "text", placeholder: "John Doe" },
      { name: "email", label: "Email", type: "email", placeholder: "john@university.edu" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "+234 800 000 0000" },
      { name: "school", label: "School / University", type: "text", placeholder: "University of Lagos" },
      { name: "hostel", label: "Hostel / Location", type: "text", placeholder: "Block A, Room 12" },
      { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
    ],
  },
  vendor: {
    label: "Vendor",
    fields: [
      { name: "businessName", label: "Business Name", type: "text", placeholder: "Mama's Kitchen" },
      { name: "ownerName", label: "Owner Name", type: "text", placeholder: "Jane Doe" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "+234 800 000 0000" },
      { name: "email", label: "Email", type: "email", placeholder: "vendor@email.com" },
      { name: "campusLocation", label: "Campus Location", type: "text", placeholder: "Faculty of Science area" },
      { name: "foodCategory", label: "Food Category", type: "text", placeholder: "Nigerian, Continental" },
      { name: "operatingHours", label: "Operating Hours", type: "text", placeholder: "8AM - 8PM" },
      { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
    ],
  },
  farmer: {
    label: "Farmer",
    fields: [
      { name: "farmName", label: "Farm Name", type: "text", placeholder: "Green Valley Farm" },
      { name: "farmerName", label: "Your Name", type: "text", placeholder: "Farmer Joe" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "+234 800 000 0000" },
      { name: "email", label: "Email", type: "email", placeholder: "farmer@email.com" },
      { name: "farmLocation", label: "Farm Location", type: "text", placeholder: "Ogun State" },
      { name: "produceCategories", label: "Produce Categories", type: "text", placeholder: "Vegetables, Grains" },
      { name: "harvestCapacity", label: "Weekly Harvest Capacity", type: "text", placeholder: "500kg" },
      { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
    ],
  },
  rider: {
    label: "Rider",
    fields: [
      { name: "fullName", label: "Full Name", type: "text", placeholder: "Speed Rider" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "+234 800 000 0000" },
      { name: "email", label: "Email", type: "email", placeholder: "rider@email.com" },
      { name: "bikeType", label: "Bike Type", type: "text", placeholder: "Honda CG 125" },
      { name: "licenseNumber", label: "License Number", type: "text", placeholder: "LAG-1234-XY" },
      { name: "location", label: "Base Location", type: "text", placeholder: "Main Gate area" },
      { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
    ],
  },
  admin: {
    label: "Admin",
    fields: [
      { name: "fullName", label: "Full Name", type: "text", placeholder: "Admin User" },
      { name: "email", label: "Email", type: "email", placeholder: "admin@bukks.com" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "+234 800 000 0000" },
      { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
    ],
  },
};

const SignupPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const config = roleFields[role || ""];
  if (!config) {
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
        <div className="glass-card p-8">
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
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">{field.label}</Label>
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="bg-muted/50 border-border font-body text-foreground placeholder:text-muted-foreground/50 focus:ring-primary/30"
                  required
                />
              </div>
            ))}

            {(role === "vendor" || role === "farmer") && (
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">
                  {role === "vendor" ? "Kitchen Photos" : "Farm Images"}
                </Label>
                <div className="glass-card p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-body">Click to upload images</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold">
              Create Account
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
