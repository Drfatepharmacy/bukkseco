import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { nigerianStates } from "@/data/nigerianStates";
import { supabase } from "@/integrations/supabase/client";
import StepShell from "@/components/signup/StepShell";
import FileUploadField from "@/components/signup/FileUploadField";
import PendingApprovalScreen from "@/components/signup/PendingApprovalScreen";

const roleMap: Record<string, { label: string; dbRole: "buyer" | "vendor" | "farmer" | "rider" }> = {
  student: { label: "Buyer", dbRole: "buyer" },
  vendor: { label: "Vendor", dbRole: "vendor" },
  farmer: { label: "Farmer", dbRole: "farmer" },
  rider: { label: "Rider", dbRole: "rider" },
};

// Per-role step counts
const stepCount = (role: string) => (role === "student" ? 3 : 4);

const accountSchema = z.object({
  fullName: z.string().trim().min(2, "Full name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
});

const contactSchema = z.object({
  phone: z.string().trim().min(7, "Phone required").max(20),
  state: z.string().min(1, "State required"),
  city: z.string().trim().min(1, "City required").max(100),
});

const SignupPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const config = roleMap[role || ""];
  if (!config || role === "admin") {
    navigate("/");
    return null;
  }

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [data, setData] = useState<Record<string, string>>({});
  const [kitchenPhotos, setKitchenPhotos] = useState<File[]>([]);
  const [licenseFile, setLicenseFile] = useState<File[]>([]);
  const [farmPhotos, setFarmPhotos] = useState<File[]>([]);

  const total = stepCount(role!);

  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));

  const goBack = () => {
    if (step === 1) navigate("/");
    else setStep((s) => s - 1);
  };

  const validateStep = (): boolean => {
    try {
      if (step === 1) accountSchema.parse(data);
      else if (step === 2) {
        contactSchema.parse(data);
        if (role === "vendor" && !data.businessName?.trim()) throw new Error("Business name required");
        if (role === "farmer" && !data.farmType?.trim()) throw new Error("Farm type required");
        if (role === "rider" && !data.vehicleType?.trim()) throw new Error("Vehicle type required");
      } else if (step === 3 && role !== "student") {
        if (role === "rider" && licenseFile.length === 0) throw new Error("Driver license required");
        if (role === "vendor" && kitchenPhotos.length === 0) throw new Error("At least one kitchen photo required");
        if (role === "farmer" && farmPhotos.length === 0) throw new Error("At least one farm photo required");
      }
      return true;
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || "Please fill all fields";
      toast.error(msg);
      return false;
    }
  };

  const uploadFiles = async (
    bucket: string,
    userId: string,
    folder: string,
    files: File[]
  ): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.split(".").pop() || "bin";
      const path = `${userId}/${folder}-${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, f, { upsert: true });
      if (error) throw error;
      if (bucket === "verification-docs") {
        urls.push(path); // private — store path
      } else {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        urls.push(pub.publicUrl);
      }
    }
    return urls;
  };

  const submit = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { full_name: data.fullName, role: config.dbRole },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");
      const userId = authData.user.id;

      await supabase
        .from("profiles")
        .update({
          phone: data.phone || null,
          state: data.state || null,
          city: data.city || null,
        })
        .eq("id", userId);

      if (role === "vendor") {
        const photos = await uploadFiles("food-images", userId, "kitchen", kitchenPhotos);
        await supabase.from("vendor_profiles").insert({
          user_id: userId,
          business_name: data.businessName,
          food_category: data.foodCategory || null,
          business_description: data.businessDesc || null,
          kitchen_photos: photos,
        });
      } else if (role === "farmer") {
        const photos = await uploadFiles("verification-docs", userId, "farm", farmPhotos);
        await supabase.from("farmer_profiles").insert({
          user_id: userId,
          farm_type: data.farmType || null,
          products: data.products || null,
          farm_photos: photos,
          farm_size_hectares: data.farmSize ? Number(data.farmSize) : null,
        } as any);
      } else if (role === "rider") {
        const [licUrl] = await uploadFiles("verification-docs", userId, "license", licenseFile);
        await supabase.from("rider_profiles").insert({
          user_id: userId,
          vehicle_type: data.vehicleType || null,
          license_url: licUrl || null,
        });
      }

      if (role === "student") {
        toast.success("Welcome to BUKKS!");
        navigate(`/dashboard/student`);
      } else {
        setDone(true);
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (!validateStep()) return;
    if (step === total) submit();
    else setStep((s) => s + 1);
  };

  if (done) return <PendingApprovalScreen roleLabel={config.label} />;

  // ------- Step renderers -------
  const renderStep1 = () => (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-body text-muted-foreground">Full Name</Label>
        <Input
          value={data.fullName || ""}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="John Doe"
          className="bg-muted/50 border-border font-body"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-body text-muted-foreground">Email Address</Label>
        <Input
          type="email"
          value={data.email || ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="john@email.com"
          className="bg-muted/50 border-border font-body"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-body text-muted-foreground">Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={data.password || ""}
            onChange={(e) => set("password", e.target.value)}
            placeholder="At least 8 characters"
            className="bg-muted/50 border-border font-body pr-10"
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
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-body text-muted-foreground">Phone Number</Label>
        <Input
          type="tel"
          value={data.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+234 800 000 0000"
          className="bg-muted/50 border-border font-body"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-body text-muted-foreground">State</Label>
        <select
          className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-body"
          value={data.state || ""}
          onChange={(e) => set("state", e.target.value)}
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
          value={data.city || ""}
          onChange={(e) => set("city", e.target.value)}
          placeholder="Benin City"
          className="bg-muted/50 border-border font-body"
        />
      </div>

      {role === "vendor" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">Business Name</Label>
            <Input
              value={data.businessName || ""}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="Mama's Kitchen"
              className="bg-muted/50 border-border font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">Food Category</Label>
            <Input
              value={data.foodCategory || ""}
              onChange={(e) => set("foodCategory", e.target.value)}
              placeholder="Nigerian, Continental"
              className="bg-muted/50 border-border font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">Business Description</Label>
            <Textarea
              value={data.businessDesc || ""}
              onChange={(e) => set("businessDesc", e.target.value)}
              placeholder="Tell us about your food business..."
              className="bg-muted/50 border-border font-body"
              rows={3}
            />
          </div>
        </>
      )}

      {role === "farmer" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">Farm Type</Label>
            <Input
              value={data.farmType || ""}
              onChange={(e) => set("farmType", e.target.value)}
              placeholder="Crop, Livestock, Mixed"
              className="bg-muted/50 border-border font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">Products Produced</Label>
            <Input
              value={data.products || ""}
              onChange={(e) => set("products", e.target.value)}
              placeholder="Tomatoes, Peppers, Rice"
              className="bg-muted/50 border-border font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">Farm Size (hectares)</Label>
            <Input
              type="number"
              value={data.farmSize || ""}
              onChange={(e) => set("farmSize", e.target.value)}
              placeholder="2.5"
              className="bg-muted/50 border-border font-body"
            />
          </div>
        </>
      )}

      {role === "rider" && (
        <div className="space-y-1.5">
          <Label className="text-sm font-body text-muted-foreground">Vehicle Type</Label>
          <select
            className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-body"
            value={data.vehicleType || ""}
            onChange={(e) => set("vehicleType", e.target.value)}
          >
            <option value="">Select vehicle</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="bicycle">Bicycle</option>
            <option value="car">Car</option>
            <option value="foot">On Foot</option>
          </select>
        </div>
      )}
    </>
  );

  const renderStep3 = () => {
    if (role === "vendor") {
      return (
        <FileUploadField
          label="Kitchen Photos"
          multiple
          onFiles={setKitchenPhotos}
          files={kitchenPhotos}
        />
      );
    }
    if (role === "farmer") {
      return (
        <FileUploadField
          label="Farm Photos"
          multiple
          onFiles={setFarmPhotos}
          files={farmPhotos}
        />
      );
    }
    if (role === "rider") {
      return (
        <FileUploadField
          label="Driver License"
          accept="image/*,application/pdf"
          onFiles={setLicenseFile}
          files={licenseFile}
        />
      );
    }
    // Student review
    return (
      <div className="space-y-2 text-sm font-body">
        <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span>{data.fullName}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span>{data.email}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span><span>{data.phone}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Location:</span><span>{data.city}, {data.state}</span></div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-2 text-sm font-body">
      <p className="text-muted-foreground mb-3">Review your details before submitting:</p>
      <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span>{data.fullName}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span>{data.email}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span><span>{data.phone}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Location:</span><span>{data.city}, {data.state}</span></div>
      {role === "vendor" && (
        <div className="flex justify-between"><span className="text-muted-foreground">Business:</span><span>{data.businessName}</span></div>
      )}
      {role === "farmer" && (
        <div className="flex justify-between"><span className="text-muted-foreground">Farm Type:</span><span>{data.farmType}</span></div>
      )}
      {role === "rider" && (
        <div className="flex justify-between"><span className="text-muted-foreground">Vehicle:</span><span>{data.vehicleType}</span></div>
      )}
      <p className="text-xs text-muted-foreground pt-3">
        Your account will be reviewed by an admin within 24 hours.
      </p>
    </div>
  );

  const titles: Record<number, string> = {
    1: "Create Account",
    2: role === "vendor" ? "Business Details" : role === "farmer" ? "Farm Details" : role === "rider" ? "Vehicle Details" : "Contact Info",
    3: role === "student" ? "Review" : role === "rider" ? "Verification" : "Photos",
    4: "Review & Submit",
  };

  return (
    <StepShell
      title={`Join as ${config.label}`}
      subtitle={titles[step]}
      step={step}
      total={total}
      onBack={goBack}
      onNext={next}
      nextLabel={step === total ? "Create Account" : "Continue"}
      loading={loading}
    >
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </StepShell>
  );
};

export default SignupPage;
