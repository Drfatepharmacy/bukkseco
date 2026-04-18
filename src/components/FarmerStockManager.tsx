import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, Trash2, Edit2, Eye, EyeOff, Users, Sprout, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PRODUCE_CATEGORIES = ["Vegetables", "Fruits", "Grains", "Tubers", "Legumes", "Livestock", "Poultry", "Fish", "Dairy", "Other"];
const UNITS = ["kg", "bag", "basket", "crate", "piece", "liter", "ton"];

const FarmerStockManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Vegetables",
    unit: "kg",
    stock_quantity: "",
    image: null as File | null,
    group_buy_enabled: true,
    group_buy_min_qty: "10",
    group_buy_discount_percent: "15",
  });
  const [uploading, setUploading] = useState(false);

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ["farmer-stocks", user?.id],
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
    const path = `farmers/${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("food-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("food-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveStock = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let imageUrl = "";
      if (form.image) {
        imageUrl = await uploadImage(form.image);
      }

      const stockData = {
        vendor_id: user!.id,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        category: form.category,
        unit: form.unit,
        stock_quantity: parseInt(form.stock_quantity),
        group_buy_enabled: form.group_buy_enabled,
        group_buy_min_qty: parseInt(form.group_buy_min_qty),
        group_buy_discount_percent: parseFloat(form.group_buy_discount_percent),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };

      if (editingId) {
        const { error } = await supabase.from("meals").update(stockData).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meals").insert(stockData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Stock updated!" : "Stock added!");
      queryClient.invalidateQueries({ queryKey: ["farmer-stocks"] });
      resetForm();
      setUploading(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save stock");
      setUploading(false);
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase.from("meals").update({ is_available: available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farmer-stocks"] }),
  });

  const deleteStock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stock deleted");
      queryClient.invalidateQueries({ queryKey: ["farmer-stocks"] });
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      category: "Vegetables",
      unit: "kg",
      stock_quantity: "",
      image: null,
      group_buy_enabled: true,
      group_buy_min_qty: "10",
      group_buy_discount_percent: "15",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (stock: any) => {
    setForm({
      name: stock.name,
      description: stock.description || "",
      price: String(stock.price),
      category: stock.category || "Vegetables",
      unit: stock.unit || "kg",
      stock_quantity: String(stock.stock_quantity || ""),
      image: null,
      group_buy_enabled: !!stock.group_buy_enabled,
      group_buy_min_qty: String(stock.group_buy_min_qty || 10),
      group_buy_discount_percent: String(stock.group_buy_discount_percent || 15),
    });
    setEditingId(stock.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.stock_quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    saveStock.mutate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Sprout className="w-5 h-5 text-success" /> Produce Management
        </h2>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-gold bg-success hover:bg-success/90">
          <Plus className="w-4 h-4 mr-2" /> Add Produce
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
              <Label className="text-sm font-body text-muted-foreground">Produce Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fresh Tomatoes" required className="bg-muted/50 font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Price (₦) per {form.unit}</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="500" required className="bg-muted/50 font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-muted/50 font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="bg-muted/50 font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-body text-muted-foreground">Stock Qty</Label>
                <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} placeholder="100" className="bg-muted/50 font-body" />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Produce Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} className="bg-muted/50 font-body" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-sm font-body text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Fresh from the farm..." rows={3} className="bg-muted/50 font-body" />
            </div>

            <div className="md:col-span-2 space-y-4 border-t border-border pt-4 mt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold font-display">Enable Bulk Discount / Group Buy</Label>
                  <p className="text-xs text-muted-foreground font-body">Incentivize bulk purchases from vendors or students</p>
                </div>
                <Switch
                  checked={form.group_buy_enabled}
                  onCheckedChange={(checked) => setForm({ ...form, group_buy_enabled: checked })}
                />
              </div>

              {form.group_buy_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-muted-foreground">Min Qty for Bulk Price ({form.unit})</Label>
                    <Input
                      type="number"
                      min="2"
                      value={form.group_buy_min_qty}
                      onChange={(e) => setForm({ ...form, group_buy_min_qty: e.target.value })}
                      className="bg-muted/50 font-body h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-muted-foreground">Bulk Discount Percentage (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={form.group_buy_discount_percent}
                      onChange={(e) => setForm({ ...form, group_buy_discount_percent: e.target.value })}
                      className="bg-muted/50 font-body h-9"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button type="submit" disabled={uploading} className="btn-gold bg-success hover:bg-success/90">
              {uploading ? "Saving..." : editingId ? "Update Stock" : "Add Produce"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground font-body">Loading stocks...</div>
      ) : stocks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-body">No stock yet. Start uploading your produce!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock: any) => (
            <motion.div key={stock.id} layout className="geo-card overflow-hidden">
              {stock.image_url && (
                <img src={stock.image_url} alt={stock.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{stock.name}</h3>
                    <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                      <Scale className="w-3 h-3" /> {stock.category} • {stock.stock_quantity} {stock.unit} left
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-body ${stock.is_available ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {stock.is_available ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-body mt-2 line-clamp-2">{stock.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-foreground">₦{Number(stock.price).toLocaleString()} / {stock.unit}</span>
                    {stock.group_buy_enabled && (
                      <span className="text-[10px] text-primary font-bold">Bulk Discount ON</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAvailability.mutate({ id: stock.id, available: !stock.is_available })} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      {stock.is_available ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => startEdit(stock)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteStock.mutate(stock.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
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

export default FarmerStockManager;
