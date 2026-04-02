import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProfileSettingsProps {
  role?: string;
}

const ProfileSettings = ({ role }: ProfileSettingsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    state: "",
    city: "",
    // Vendor fields
    business_name: "",
    business_description: "",
    food_category: "",
    // Farmer fields
    farm_type: "",
    products: "",
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: vendorProfile } = useQuery({
    queryKey: ["vendor-profile-settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user && role === "vendor",
  });

  const { data: farmerProfile } = useQuery({
    queryKey: ["farmer-profile-settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("farmer_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user && role === "farmer",
  });

  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        state: profile.state || "",
        city: profile.city || "",
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (vendorProfile) {
      setForm(prev => ({
        ...prev,
        business_name: vendorProfile.business_name || "",
        business_description: vendorProfile.business_description || "",
        food_category: vendorProfile.food_category || "",
      }));
    }
  }, [vendorProfile]);

  useEffect(() => {
    if (farmerProfile) {
      setForm(prev => ({
        ...prev,
        farm_type: farmerProfile.farm_type || "",
        products: farmerProfile.products || "",
      }));
    }
  }, [farmerProfile]);

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("food-images").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("food-images").getPublicUrl(path).data.publicUrl;
  };

  const saveProfile = useMutation({
    mutationFn: async () => {
      let avatarUrl = profile?.avatar_url;
      let bannerUrl = profile?.banner_url;

      if (avatarFile) avatarUrl = await uploadFile(avatarFile, "avatar");
      if (bannerFile) bannerUrl = await uploadFile(bannerFile, "banner");

      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      }).eq("id", user!.id);
      if (error) throw error;

      if (role === "vendor" && vendorProfile) {
        await supabase.from("vendor_profiles").update({
          business_name: form.business_name.trim(),
          business_description: form.business_description.trim(),
          food_category: form.food_category.trim(),
        }).eq("user_id", user!.id);
      }

      if (role === "farmer" && farmerProfile) {
        await supabase.from("farmer_profiles").update({
          farm_type: form.farm_type.trim(),
          products: form.products.trim(),
        }).eq("user_id", user!.id);
      }
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
      setAvatarFile(null);
      setBannerFile(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url;
  const bannerPreview = bannerFile ? URL.createObjectURL(bannerFile) : profile?.banner_url;

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Profile Settings</h2>

      {/* Banner */}
      <div className="relative mb-8 rounded-xl overflow-hidden">
        <div
          className="h-36 bg-gradient-to-r from-primary/20 to-secondary/20 bg-cover bg-center"
          style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : {}}
        />
        <label className="absolute bottom-2 right-2 cursor-pointer bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-body text-foreground hover:bg-background transition-colors">
          <Upload className="w-3.5 h-3.5" /> Banner
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
        </label>

        {/* Avatar overlay */}
        <div className="absolute -bottom-8 left-6">
          <label className="cursor-pointer group relative">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              {avatarPreview && <AvatarImage src={avatarPreview} />}
              <AvatarFallback className="bg-primary/10 text-primary font-display text-xl">
                {form.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
          </label>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }} className="space-y-4 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">Full Name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-muted/50 font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-muted/50 font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">State</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="bg-muted/50 font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-body text-muted-foreground">City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-muted/50 font-body" />
          </div>
        </div>

        {/* Vendor-specific */}
        {role === "vendor" && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-display text-sm font-semibold text-foreground">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Business Name</Label>
                <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="bg-muted/50 font-body" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Food Category</Label>
                <Input value={form.food_category} onChange={(e) => setForm({ ...form, food_category: e.target.value })} placeholder="Nigerian, Continental, Pastries" className="bg-muted/50 font-body" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Business Description</Label>
              <Textarea value={form.business_description} onChange={(e) => setForm({ ...form, business_description: e.target.value })} rows={3} className="bg-muted/50 font-body" />
            </div>
          </div>
        )}

        {/* Farmer-specific */}
        {role === "farmer" && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-display text-sm font-semibold text-foreground">Farm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Farm Type</Label>
                <Input value={form.farm_type} onChange={(e) => setForm({ ...form, farm_type: e.target.value })} placeholder="Crop, Livestock, Mixed" className="bg-muted/50 font-body" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Products / Crop Types</Label>
                <Input value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} placeholder="Rice, Beans, Tomatoes" className="bg-muted/50 font-body" />
              </div>
            </div>
          </div>
        )}

        <Button type="submit" disabled={saveProfile.isPending} className="mt-4">
          <Save className="w-4 h-4 mr-2" /> {saveProfile.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileSettings;
