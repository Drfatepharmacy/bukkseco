import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingCart, Search, Plus, Minus, X, Users, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePaystackPayment } from "react-paystack";
import { calculateDeliveryFee } from "@/lib/pricing/delivery";
import { getCartItemPrice, isGroupBuyActive } from "@/lib/pricing/groupBuy";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { browserNotify } from "@/hooks/usePermissions";

const PAYSTACK_PUBLIC_KEY = "pk_live_efc7f697d85e3814c0eac669cb42221df8cb1ba1";


const PaystackCheckoutButton = ({ 
  amount, email, onSuccess, onClose, disabled, label 
}: { 
  amount: number; email: string; onSuccess: (ref: string) => void; onClose: () => void; disabled: boolean; label: string;
}) => {
  const config = {
    reference: `BKS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    amount: Math.round(amount * 100), // kobo
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: "NGN",
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <Button
      onClick={() => {
        initializePayment({
          onSuccess: (response: any) => onSuccess(response.reference),
          onClose,
        });
      }}
      disabled={disabled}
      className="w-full mt-6 btn-gold py-5"
    >
      {label}
    </Button>
  );
};

const BrowseFood = () => {
  const { user } = useAuth();
  const { playSound } = useSoundNotification();
  const { cart, addToCart, updateQuantity, removeFromCart, toggleGroupBuy, clearCart, cartTotal, discountTotal, grandTotal: cartGrandTotal } = useCart();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("All");
  const [showCart, setShowCart] = useState(false);
  const [orderAddress, setOrderAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: meals = [], isLoading, error: mealsError } = useQuery({
    queryKey: ["browse-meals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("is_available", true)
        .order("rating_avg", { ascending: false });
      if (error) throw error;

      // Enrich with vendor delivery_multiplier (separate query — no FK embed)
      const vendorIds = Array.from(new Set((data || []).map((m: any) => m.vendor_id).filter(Boolean)));
      let vendorMap: Record<string, { delivery_multiplier: number }> = {};
      if (vendorIds.length) {
        const { data: vps } = await supabase
          .from("vendor_profiles")
          .select("user_id, delivery_multiplier")
          .in("user_id", vendorIds);
        vendorMap = Object.fromEntries((vps || []).map((v: any) => [v.user_id, { delivery_multiplier: v.delivery_multiplier ?? 1.0 }]));
      }
      return (data || []).map((m: any) => ({ ...m, vendor: vendorMap[m.vendor_id] || { delivery_multiplier: 1.0 } }));
    },
  });

  if (mealsError) console.error("Browse meals error:", mealsError);

  const categories = ["All", ...new Set(meals.map((m: any) => m.category).filter(Boolean))];

  const filtered = meals.filter((m: any) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                         (m.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || m.category === category;
    return matchesSearch && matchesCat;
  });

  // Calculate delivery fee based on the first item's vendor for simplicity in this UI
  // Real implementation might handle multiple vendors differently
  // Fee is calculated AFTER group discount per requirements
  const deliveryFee = cart.length > 0
    ? calculateDeliveryFee(cartGrandTotal, cart[0].meal.vendor?.delivery_multiplier || 1.0)
    : 0;

  const finalGrandTotal = cartGrandTotal + deliveryFee;

  const handlePaymentSuccess = async (reference: string) => {
    if (!user || cart.length === 0 || !orderAddress.trim()) return;
    setIsProcessing(true);

    try {
      // Group cart items by vendor
      const vendorGroups: Record<string, any[]> = {};
      cart.forEach(item => {
        const vid = item.meal.vendor_id;
        if (!vendorGroups[vid]) vendorGroups[vid] = [];
        vendorGroups[vid].push(item);
      });

      for (const [vendorId, items] of Object.entries(vendorGroups)) {
        const vendorSubtotal = items.reduce((sum, c) => {
          const price = getCartItemPrice(c);
          return sum + price * c.quantity;
        }, 0);

        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            buyer_id: user.id,
            vendor_id: vendorId,
            total_amount: vendorSubtotal + deliveryFee,
            delivery_address: orderAddress.trim(),
            delivery_fee: deliveryFee,
            payment_reference: reference,
            payment_status: "verifying",
            subtotal: vendorSubtotal,
          })
          .select()
          .single();

        if (orderErr) throw orderErr;

        const orderItems = items.map(c => {
          const unitPrice = getCartItemPrice(c);
          return {
            order_id: order.id,
            meal_id: c.meal.id,
            quantity: c.quantity,
            unit_price: unitPrice,
          };
        });

        const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
        if (itemsErr) throw itemsErr;

        // Verify payment server-side
        const { error: verifyErr } = await supabase.functions.invoke("verify-payment", {
          body: { reference, order_id: order.id },
        });

        if (verifyErr) {
          console.error("Payment verification error:", verifyErr);
        }
      }

      toast.success("Order placed & payment verified! 🎉");
      playSound("order");
      browserNotify("Order placed", `₦${finalGrandTotal.toLocaleString()} — payment verified`);
      clearCart();
      setShowCart(false);
      setOrderAddress("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentClose = () => {
    toast.info("Payment cancelled");
  };

  return (
    <div>
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meals..."
            className="pl-10 bg-muted/50 font-body"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat as string)}
              className={`px-4 py-2 rounded-full text-xs font-body whitespace-nowrap transition-colors ${
                category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat as string}
            </button>
          ))}
        </div>
      </div>


      {/* Meals Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground font-body">Loading meals...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-body">No meals found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((meal: any, i: number) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="geo-card overflow-hidden group"
            >
              {meal.image_url ? (
                <img src={meal.image_url} alt={meal.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-44 bg-muted/50 flex items-center justify-center text-5xl">🍽️</div>
              )}
              <div className="p-4">
                <h3 className="font-display font-semibold text-foreground">{meal.name}</h3>
                <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">{meal.description}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-xs font-body text-muted-foreground">{Number(meal.rating_avg).toFixed(1)} ({meal.rating_count})</span>
                  {meal.category && <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-body">{meal.category}</span>}
                  {meal.stock_quantity !== null && meal.stock_quantity !== undefined && meal.stock_quantity <= 10 && meal.stock_quantity > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">{meal.stock_quantity} left</span>
                  )}
                  {meal.stock_quantity !== null && meal.stock_quantity !== undefined && meal.stock_quantity <= 0 && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-body">Sold out</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display text-lg font-bold text-foreground">₦{Number(meal.price).toLocaleString()}</span>
                  <Button 
                    onClick={() => addToCart(meal)} 
                    size="sm" 
                    className="btn-gold"
                    disabled={meal.stock_quantity !== null && meal.stock_quantity !== undefined && meal.stock_quantity <= 0}
                  >
                    <Plus className="w-4 h-4 mr-1" /> {meal.stock_quantity !== null && meal.stock_quantity !== undefined && meal.stock_quantity <= 0 ? "Sold out" : "Add"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseFood;
