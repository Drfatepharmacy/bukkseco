import { useState } from "react";
import { Plus, Upload, Trash2, Edit2, Eye, EyeOff, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardSidebar from "@/components/DashboardSidebar";
import { dashboardConfigs } from "@/config/dashboardConfig";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const VendorMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    unit: "Scoop",
    requiresTakeaway: false,
    takeawayUnitType: "Per Item",
    available: true,
    image: null as File | null
  });

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = "";
      if (form.image) {
        imageUrl = await uploadImage(form.image);
      }

      const mealData = {
        vendor_id: user!.id,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        unit: form.unit,
        requires_takeaway: form.requiresTakeaway,
        takeaway_unit_type: form.takeawayUnitType,
        is_available: form.available,
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
      toast.success(editingId ? "Item updated!" : "Item added to menu!");
      queryClient.invalidateQueries({ queryKey: ["vendor-meals"] });
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      unit: "Scoop",
      requiresTakeaway: false,
      takeawayUnitType: "Per Item",
      available: true,
      image: null
    });
    setEditingId(null);
  };

  const handleEdit = (meal: any) => {
    setForm({
      name: meal.name,
      description: meal.description || "",
      price: String(meal.price),
      category: meal.category || "",
      unit: meal.unit || "Scoop",
      requiresTakeaway: meal.requires_takeaway || false,
      takeawayUnitType: meal.takeaway_unit_type || "Per Item",
      available: meal.is_available,
      image: null
    });
    setEditingId(meal.id);
    setIsOpen(true);
  };

  const navItems = dashboardConfigs.vendor.navItems.map((item) => ({
    ...item,
    active: item.label === "Manage Menu",
    onClick: () => {
      if (item.label === "Overview") navigate("/vendor/dashboard");
      else if (item.label === "Orders") navigate("/vendor/orders");
      else if (item.label === "Revenue") navigate("/vendor/sales");
    },
  }));

  const filteredMeals = meals.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar
        items={navItems}
        role="Vendor"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Menu Management</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Manage your food items and pricing</p>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn-gold"><Plus className="w-4 h-4 mr-2" /> Add New Item</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl font-bold">Add New Menu Item</DialogTitle>
                  <p className="text-sm text-muted-foreground">Add a new item to your menu. Fill in the details below.</p>
                </DialogHeader>

                <form className="space-y-4 mt-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Item Name</Label>
                    <Input placeholder="Enter item name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Description</Label>
                    <Textarea placeholder="Enter item description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Main Dish">Main Dish</SelectItem>
                        <SelectItem value="Side Dish">Side Dish</SelectItem>
                        <SelectItem value="Drinks">Drinks</SelectItem>
                        <SelectItem value="Dessert">Dessert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Price (₦)</Label>
                      <Input type="number" placeholder="500" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Unit</Label>
                      <Input placeholder="Scoop" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="takeaway" checked={form.requiresTakeaway} onCheckedChange={(checked) => setForm({...form, requiresTakeaway: !!checked})} />
                    <Label htmlFor="takeaway" className="text-sm">Requires Takeaway</Label>
                  </div>

                  {form.requiresTakeaway && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Takeaway Unit Type</Label>
                      <Select value={form.takeawayUnitType} onValueChange={v => setForm({...form, takeawayUnitType: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Per Item">Per Item</SelectItem>
                          <SelectItem value="Per Order">Per Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                       <Switch checked={form.available} onCheckedChange={(checked) => setForm({...form, available: checked})} />
                       <Label>Available for orders</Label>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-red-400 hover:bg-red-500 text-white" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
                className="pl-10 bg-white"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-white/50 animate-pulse rounded-xl" />)}
             </div>
          ) : filteredMeals.length === 0 ? (
             <div className="bg-white rounded-xl p-12 text-center border border-dashed border-muted-foreground/20">
                <p className="text-muted-foreground">No menu items found. Start by adding one!</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredMeals.map((meal) => (
                 <motion.div key={meal.id} layout className="bg-white rounded-xl overflow-hidden border border-border group">
                    <div className="h-40 bg-muted flex items-center justify-center relative">
                        {meal.image_url ? (
                            <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-muted-foreground text-xs uppercase font-bold tracking-widest">No Image</div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                            <Button variant="secondary" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(meal)}>
                                <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-foreground">{meal.name}</h3>
                            <span className="font-bold text-primary">₦{meal.price}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-1">{meal.description || "No description provided."}</p>
                        <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${meal.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-xs font-medium">{meal.is_available ? "Active" : "Hidden"}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                {meal.category || "General"}
                            </span>
                        </div>
                    </div>
                 </motion.div>
               ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VendorMenu;
