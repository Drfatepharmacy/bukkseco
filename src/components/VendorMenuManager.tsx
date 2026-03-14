import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const VendorMenuManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", image: null as File | null });
  const [uploading, setUploading] = useState(false);

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ["vendor-meals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("vendor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("food-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("food-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMeal = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let imageUrl = "";
      if (form.image) {
        imageUrl = await uploadImage(form.image);
      }

      const mealData = {
        vendor_id: user!.id,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        category: form.category.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };

      if (editingId) {
        const { error } = await supabase.from("meals").update(mealData).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meals").insert(mealData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Meal updated!" : "Meal added!");
      queryClient.invalidateQueries({ queryKey: ["vendor-meals"] });
      resetForm();
      setUploading(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save meal");
      setUploading(false);
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase.from("meals").update({ is_available: available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-meals"] }),
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meal deleted");
      queryClient.invalidateQueries({ queryKey: ["vendor-meals"] });
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", category: "", image: null });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (meal: any) => {
    setForm({
      name: meal.name,
      description: meal.description || "",
      price: String(meal.price),
      category: meal.category || "",
      image: null,
    });
    setEditingId(meal.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || parseFloat(form.price) <= 0) {
      toast.error("Please fill in name and a valid price");
      return;
    }
    saveMeal.mutate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-foreground">Menu Management</h2>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-gold">
          <Plus className="w-4 h-4 mr-2" /> Add Meal
        </Button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="geo-card p-6 mb-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Food Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jollof Rice" required className="bg-muted/50 font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Price (₦)</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2500" required className="bg-muted/50 font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Nigerian, Continental" className="bg-muted/50 font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Food Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} className="bg-muted/50 font-body" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this meal..." rows={3} className="bg-muted/50 font-body" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button type="submit" disabled={uploading} className="btn-gold">
              {uploading ? "Saving..." : editingId ? "Update Meal" : "Add Meal"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground font-body">Loading menu...</div>
      ) : meals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-body">No meals yet. Add your first dish!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meals.map((meal: any) => (
            <motion.div key={meal.id} layout className="geo-card overflow-hidden">
              {meal.image_url && (
                <img src={meal.image_url} alt={meal.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{meal.name}</h3>
                    <p className="text-xs text-muted-foreground font-body">{meal.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-body ${meal.is_available ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {meal.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-body mt-2 line-clamp-2">{meal.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display font-bold text-foreground">₦{Number(meal.price).toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAvailability.mutate({ id: meal.id, available: !meal.is_available })} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      {meal.is_available ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => startEdit(meal)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteMeal.mutate(meal.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorMenuManager;
