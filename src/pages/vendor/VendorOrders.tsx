import { useState } from "react";
import { Package, Search, Filter, MoreHorizontal } from "lucide-react";
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

const VendorOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["vendor-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                *,
                meals (*)
            )
        `)
        .eq("vendor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const navItems = dashboardConfigs.vendor.navItems.map((item) => ({
    ...item,
    active: item.label === "Orders",
    onClick: () => {
      if (item.label === "Overview") navigate("/vendor/dashboard");
      else if (item.label === "Manage Menu") navigate("/vendor/menu");
      else if (item.label === "Revenue") navigate("/vendor/sales");
    },
  }));

  const filteredOrders = orders.filter(o => o.order_number.toLowerCase().includes(searchTerm.toLowerCase()));

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
        role="Vendor"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Order Management</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Track and manage your customer orders</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
            </div>
          </div>

          <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
                className="pl-10 bg-white"
                placeholder="Search by order number..."
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
                    <Card key={order.id} className="overflow-hidden border-border">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">#{order.order_number}</span>
                                        <Badge className={`capitalize ${getStatusColor(order.status)}`} variant="secondary">
                                            {order.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Total</p>
                                        <p className="font-bold text-lg">₦{order.total_amount}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {order.status === "pending" && (
                                            <>
                                                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => updateStatus.mutate({ id: order.id, status: "confirmed" })}>Accept</Button>
                                                <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => updateStatus.mutate({ id: order.id, status: "cancelled" })}>Reject</Button>
                                            </>
                                        )}
                                        {order.status === "confirmed" && (
                                            <Button size="sm" className="btn-gold" onClick={() => updateStatus.mutate({ id: order.id, status: "preparing" })}>Start Preparing</Button>
                                        )}
                                        {order.status === "preparing" && (
                                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => updateStatus.mutate({ id: order.id, status: "out_for_delivery" })}>Ready for Pickup</Button>
                                        )}
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Items</p>
                                    <div className="space-y-1">
                                        {order.order_items?.map((item: any) => (
                                            <div key={item.id} className="text-sm flex justify-between">
                                                <span>{item.quantity}x {item.meals?.name || "Unknown Item"}</span>
                                                <span className="text-muted-foreground">₦{item.unit_price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Delivery Details</p>
                                    <p className="text-sm">{order.delivery_address || "No address provided"}</p>
                                    {order.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{order.notes}"</p>}
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

export default VendorOrders;
