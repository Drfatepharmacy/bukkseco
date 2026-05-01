import { useState } from "react";
import { Package, Search, Filter, MoreHorizontal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/DashboardSidebar";
import { dashboardConfigs } from "@/config/dashboardConfig";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items (*, meals (*))`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const buyerIds = Array.from(new Set((data ?? []).map((o: any) => o.buyer_id).filter(Boolean)));
      const vendorIds = Array.from(new Set((data ?? []).map((o: any) => o.vendor_id).filter(Boolean)));

      const [buyersRes, vendorsRes] = await Promise.all([
        buyerIds.length
          ? supabase.from("profiles").select("id, full_name, email, phone").in("id", buyerIds)
          : Promise.resolve({ data: [] as any[] }),
        vendorIds.length
          ? supabase.from("vendor_profiles").select("user_id, business_name").in("user_id", vendorIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const buyerMap = new Map((buyersRes.data ?? []).map((b: any) => [b.id, b]));
      const vendorMap = new Map((vendorsRes.data ?? []).map((v: any) => [v.user_id, v]));

      return (data ?? []).map((o: any) => ({
        ...o,
        profiles: buyerMap.get(o.buyer_id) ?? null,
        vendor: vendorMap.get(o.vendor_id) ?? null,
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status overridden");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const navItems = dashboardConfigs.admin.navItems.map((item) => ({
    ...item,
    active: item.label === "Monitor Orders",
    onClick: () => {
      if (item.label === "Overview") navigate("/admin/dashboard");
      else if (item.label === "Approve Vendors") navigate("/admin/vendors");
    },
  }));

  const filteredOrders = orders.filter(o =>
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.vendor?.business_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
        case "pending": return "bg-yellow-100 text-yellow-700";
        case "confirmed": return "bg-blue-100 text-blue-700";
        case "preparing": return "bg-purple-100 text-purple-700";
        case "delivered": return "bg-green-100 text-green-700";
        case "cancelled": return "bg-red-100 text-red-700";
        default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar
        items={navItems}
        role="Admin"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Global Order Monitor</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Real-time overview of all platform orders</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
            </div>
          </div>

          <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
                className="pl-10 bg-white"
                placeholder="Search by order number or vendor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          {isLoading ? (
             <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-white/50 animate-pulse rounded-xl" />)}
             </div>
          ) : filteredOrders.length === 0 ? (
             <div className="bg-white rounded-xl p-12 text-center border">
                <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found.</p>
             </div>
          ) : (
            <div className="space-y-4">
                {filteredOrders.map(order => (
                    <Card key={order.id} className="overflow-hidden border-border bg-white shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">#{order.order_number}</span>
                                        <Badge className={`capitalize ${getStatusColor(order.status)}`} variant="secondary">
                                            {order.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Vendor: <span className="font-semibold text-foreground">{order.vendor?.business_name}</span> • {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Total Amount</p>
                                        <p className="font-bold text-lg">₦{order.total_amount}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 border rounded-lg px-2 py-1 bg-muted/30">
                                            <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                                            <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                                                <SelectTrigger className="h-8 border-none bg-transparent text-xs font-semibold focus:ring-0 w-[120px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                                    <SelectItem value="preparing">Preparing</SelectItem>
                                                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                                    <SelectItem value="delivered">Delivered</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Customer</p>
                                    <p className="text-sm font-medium">{order.profiles?.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{order.profiles?.email}</p>
                                    <p className="text-xs text-muted-foreground">{order.profiles?.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Items</p>
                                    <div className="space-y-1">
                                        {order.order_items?.map((item: any) => (
                                            <div key={item.id} className="text-sm flex justify-between">
                                                <span>{item.quantity}x {item.meals?.name}</span>
                                                <span className="text-muted-foreground text-xs">₦{item.unit_price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Delivery Address</p>
                                    <p className="text-sm">{order.delivery_address || "No address provided"}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold uppercase text-muted-foreground">Fee: ₦{order.delivery_fee || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
