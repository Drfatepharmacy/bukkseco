import { motion } from "framer-motion";
import { Clock, Package, Truck, CheckCircle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const statusSteps = [
  { key: "pending", label: "Order Received", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing", icon: Clock },
  { key: "rider_assigned", label: "Rider Assigned", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const OrdersList = ({ viewAs }: { viewAs: "buyer" | "vendor" | "rider" }) => {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", viewAs, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, order_items(*, meals(name, image_url))")
        .order("created_at", { ascending: false });

      if (viewAs === "buyer") query = query.eq("buyer_id", user!.id);
      else if (viewAs === "vendor") query = query.eq("vendor_id", user!.id);
      else if (viewAs === "rider") query = query.eq("rider_id", user!.id);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const getStatusIndex = (status: string) => statusSteps.findIndex(s => s.key === status);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground font-body">Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-body">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order: any, i: number) => {
        const currentStep = getStatusIndex(order.status);
        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="geo-card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-foreground">{order.order_number}</h3>
                <p className="text-xs text-muted-foreground font-body">
                  {new Date(order.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-body font-semibold ${
                order.status === "delivered" ? "bg-success/10 text-success" :
                order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                "bg-primary/10 text-primary"
              }`}>
                {order.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </span>
            </div>

            {/* Order items */}
            <div className="space-y-2 mb-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.meals?.image_url ? (
                    <img src={item.meals.image_url} alt={item.meals?.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">🍽️</div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-body text-foreground">{item.meals?.name}</p>
                    <p className="text-xs text-muted-foreground font-body">x{item.quantity} • ₦{Number(item.unit_price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress timeline */}
            {order.status !== "cancelled" && (
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {statusSteps.map((step, idx) => {
                  const isActive = idx <= currentStep;
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <step.icon className="w-3 h-3" />
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div className={`w-6 h-0.5 ${idx < currentStep ? "bg-primary" : "bg-muted"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground font-body">
                {order.delivery_address && `📍 ${order.delivery_address}`}
              </span>
              <span className="font-display font-bold text-foreground">₦{Number(order.total_amount).toLocaleString()}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default OrdersList;
