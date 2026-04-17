import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingCart, Search, Plus, Minus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePaystackPayment } from "react-paystack";
import { calculateDeliveryFee } from "@/lib/pricing/delivery";

const PAYSTACK_PUBLIC_KEY = "pk_live_efc7f697d85e3814c0eac669cb42221df8cb1ba1";

interface CartItem {
  meal: any;
  quantity: number;
}

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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderAddress, setOrderAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ["browse-meals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select(`
          *,
          vendor:vendor_id (
            delivery_multiplier
          )
        `)
        .eq("is_available", true)
        .order("rating_avg", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const categories = ["All", ...new Set(meals.map((m: any) => m.category).filter(Boolean))];

  const filtered = meals.filter((m: any) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                         (m.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || m.category === category;
    return matchesSearch && matchesCat;
  });

  const addToCart = (meal: any) => {
    if (meal.stock_quantity !== null && meal.stock_quantity !== undefined && meal.stock_quantity <= 0) {
      toast.error("This item is out of stock");
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.meal.id === meal.id);
      if (existing) {
        return prev.map(c => c.meal.id === meal.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { meal, quantity: 1 }];
    });
    toast.success(`${meal.name} added to cart`);
  };

  const updateQuantity = (mealId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.meal.id === mealId) {
        const newQty = c.quantity + delta;
        return newQty <= 0 ? c : { ...c, quantity: newQty };
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (mealId: string) => {
    setCart(prev => prev.filter(c => c.meal.id !== mealId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + Number(c.meal.price) * c.quantity, 0);

  // Calculate delivery fee based on the first item's vendor for simplicity in this UI
  // Real implementation might handle multiple vendors differently
  const deliveryFee = cart.length > 0
    ? calculateDeliveryFee(cartTotal, cart[0].meal.vendor?.delivery_multiplier || 1.0)
    : 0;

  const grandTotal = cartTotal + deliveryFee;

  const handlePaymentSuccess = async (reference: string) => {
    if (!user || cart.length === 0 || !orderAddress.trim()) return;
    setIsProcessing(true);

    try {
      // Group cart items by vendor
      const vendorGroups: Record<string, CartItem[]> = {};
      cart.forEach(item => {
        const vid = item.meal.vendor_id;
        if (!vendorGroups[vid]) vendorGroups[vid] = [];
        vendorGroups[vid].push(item);
      });

      for (const [vendorId, items] of Object.entries(vendorGroups)) {
        const totalAmount = items.reduce((s, c) => s + Number(c.meal.price) * c.quantity, 0);

        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            buyer_id: user.id,
            vendor_id: vendorId,
            total_amount: totalAmount + deliveryFee,
            delivery_address: orderAddress.trim(),
            delivery_fee: deliveryFee,
            payment_reference: reference,
            payment_status: "verifying",
          })
          .select()
          .single();

        if (orderErr) throw orderErr;

        const orderItems = items.map(c => ({
          order_id: order.id,
          meal_id: c.meal.id,
          quantity: c.quantity,
          unit_price: Number(c.meal.price),
        }));

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
      setCart([]);
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

      {/* Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-24 right-6 z-40 bg-primary text-primary-foreground rounded-full p-4 shadow-lg flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-display font-bold">{cart.length}</span>
          <span className="font-body text-sm">₦{cartTotal.toLocaleString()}</span>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex justify-end"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="w-full max-w-md bg-background h-full p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-foreground">Your Cart</h2>
                <button onClick={() => setShowCart(false)}><X className="w-5 h-5" /></button>
              </div>

              {cart.map(item => (
                <div key={item.meal.id} className="flex items-center gap-3 py-3 border-b border-border">
                  <div className="flex-1">
                    <p className="font-display font-semibold text-foreground text-sm">{item.meal.name}</p>
                    <p className="text-xs text-muted-foreground font-body">₦{Number(item.meal.price).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.meal.id, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-body text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.meal.id, 1)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.meal.id)}>
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}

              <div className="mt-4 space-y-1.5">
                <label className="text-sm font-body text-muted-foreground">Delivery Address</label>
                <Input
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  placeholder="Your campus location..."
                  className="bg-muted/50 font-body"
                />
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₦{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-foreground">₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-display font-bold text-foreground border-t border-border pt-2">
                  <span>Total</span>
                  <span>₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {user && cart.length > 0 && orderAddress.trim() ? (
                <PaystackCheckoutButton
                  amount={grandTotal}
                  email={user.email || ""}
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                  disabled={isProcessing}
                  label={isProcessing ? "Processing..." : `Pay ₦${grandTotal.toLocaleString()}`}
                />
              ) : (
                <Button disabled className="w-full mt-6 py-5">
                  {!user ? "Log in to order" : !orderAddress.trim() ? "Enter delivery address" : "Add items to cart"}
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
