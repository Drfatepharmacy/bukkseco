import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Plus, Minus, ShoppingCart, ArrowLeft, MapPin, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { VendorReviews } from "@/components/VendorReviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VendorStorefrontPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { cart, addToCart: addItemToCart, cartTotal } = useCart();
  const [category, setCategory] = useState("All");

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: vendorUser } = useQuery({
    queryKey: ["vendor-user", vendor?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, banner_url, city, state")
        .eq("id", vendor!.user_id)
        .single();
      return data;
    },
    enabled: !!vendor?.user_id,
  });

  const { data: meals = [] } = useQuery({
    queryKey: ["vendor-meals", vendor?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("vendor_id", vendor!.user_id)
        .eq("is_available", true)
        .order("rating_avg", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!vendor?.user_id,
  });

  const categories = ["All", ...new Set(meals.map(m => m.category).filter(Boolean))];
  const filtered = meals.filter(m => category === "All" || m.category === category);
  const hotMeals = meals.filter(m => (m.rating_avg ?? 0) >= 4).slice(0, 4);

  const addToCart = (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
      addItemToCart(meal);
    }
  };

  const cartCount = cart.reduce((s, item) => s + item.quantity, 0);

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground font-body">Vendor not found</p>
        <Link to="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {vendorUser?.banner_url ? (
          <img src={vendorUser.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
        <Link to="/" className="absolute top-4 left-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
      </div>

      {/* Vendor Info */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-6">
          {vendorUser?.avatar_url ? (
            <img src={vendorUser.avatar_url} alt={vendor.business_name} className="w-20 h-20 rounded-2xl border-4 border-background object-cover shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-4 border-background bg-primary/10 flex items-center justify-center shadow-lg">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
          )}
          <div className="pb-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{vendor.business_name}</h1>
            {vendorUser?.city && (
              <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {vendorUser.city}, {vendorUser.state}
              </p>
            )}
          </div>
        </div>

        {vendor.business_description && (
          <p className="text-sm text-muted-foreground font-body mb-6">{vendor.business_description}</p>
        )}

        {/* Hot Meals Carousel */}
        {hotMeals.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">🔥 Trending</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {hotMeals.map(meal => (
                <motion.div
                  key={meal.id}
                  whileHover={{ scale: 1.02 }}
                  className="min-w-[200px] geo-card overflow-hidden flex-shrink-0"
                >
                  {meal.image_url ? (
                    <img src={meal.image_url} alt={meal.name} className="w-full h-28 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-28 bg-muted/50 flex items-center justify-center text-3xl">🍽️</div>
                  )}
                  <div className="p-3">
                    <p className="font-display font-semibold text-sm text-foreground truncate">{meal.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-display font-bold text-foreground">₦{Number(meal.price).toLocaleString()}</span>
                        {meal.group_buy_enabled && (
                          <span className="text-[10px] text-primary font-bold">Group Buy Available</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-xs font-body text-muted-foreground">{Number(meal.rating_avg ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categories.map(cat => (
            <button
              key={cat as string}
              onClick={() => setCategory(cat as string)}
              className={`px-4 py-2 rounded-full text-xs font-body whitespace-nowrap transition-colors ${
                category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat as string}
            </button>
          ))}
        </div>

        <Tabs defaultValue="menu" className="w-full mb-24">
          <TabsList className="w-full bg-muted/50 p-1 mb-6">
            <TabsTrigger value="menu" className="flex-1 font-display font-semibold">Menu</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 font-display font-semibold">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((meal, i) => {
                const outOfStock = meal.stock_quantity !== null && meal.stock_quantity <= 0;
                return (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`geo-card overflow-hidden ${outOfStock ? "opacity-60" : ""}`}
                  >
                    {meal.image_url ? (
                      <img src={meal.image_url} alt={meal.name} className="w-full h-40 object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-40 bg-muted/50 flex items-center justify-center text-4xl">🍽️</div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{meal.name}</h3>
                          <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">{meal.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="text-xs font-body text-muted-foreground">{Number(meal.rating_avg ?? 0).toFixed(1)}</span>
                        {meal.category && <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-body">{meal.category}</span>}
                        {meal.stock_quantity !== null && meal.stock_quantity <= 10 && meal.stock_quantity > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">{meal.stock_quantity} left</span>
                        )}
                        {outOfStock && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-body">Sold out</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-col">
                          <span className="font-display text-lg font-bold text-foreground">₦{Number(meal.price).toLocaleString()}</span>
                          {meal.group_buy_enabled && (
                            <span className="text-[10px] text-primary font-bold">Group Buy Available</span>
                          )}
                        </div>
                        <Button onClick={() => addToCart(meal.id)} size="sm" className="btn-gold" disabled={outOfStock}>
                          <Plus className="w-4 h-4 mr-1" /> {outOfStock ? "Sold out" : "Add"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="max-w-2xl mx-auto">
              <h3 className="font-display font-bold text-xl mb-6">Customer Feedback</h3>
              <VendorReviews vendorId={vendor.user_id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Cart */}
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground rounded-full px-6 py-3 shadow-lg flex items-center gap-3"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-display font-bold">{cartCount} items</span>
          <span className="font-body text-sm">₦{cartTotal.toLocaleString()}</span>
          <Link to={user ? `/dashboard/student` : "/login"}>
            <Button size="sm" variant="secondary" className="ml-2 text-xs">
              Checkout →
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default VendorStorefrontPage;
