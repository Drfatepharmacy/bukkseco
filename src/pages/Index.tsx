import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Utensils, Sprout, Bike, Users, Heart, Clock, ArrowRight, Star, Zap } from "lucide-react";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import Footer from "@/components/Footer";
import SupportButton from "@/components/SupportButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import jollofImg from "@/assets/jollof-egusi.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const { data: dbMeals = [] } = useQuery({
    queryKey: ["featured-meals"],
    queryFn: async () => {
      const { data } = await supabase.from("meals").select("*").eq("is_available", true).order("rating_avg", { ascending: false }).limit(4);
      return data || [];
    },
  });

  const { data: dbTips = [] } = useQuery({
    queryKey: ["landing-tips"],
    queryFn: async () => {
      const { data } = await supabase.from("health_tips").select("*").eq("is_active", true).limit(3);
      return data || [];
    },
  });

  const featuredMeals = dbMeals.length > 0 ? dbMeals.map((m: any) => ({
    name: m.name, vendor: m.category || "Vendor", price: `₦${Number(m.price).toLocaleString()}`, rating: Number(m.rating_avg || 0).toFixed(1), emoji: "🍽️", image_url: m.image_url,
  })) : [
    { name: "Jollof Rice & Chicken", vendor: "Mama's Kitchen", price: "₦2,500", rating: "4.8", emoji: "🍚" },
    { name: "Amala & Ewedu", vendor: "Iya Basira", price: "₦1,800", rating: "4.6", emoji: "🍲" },
    { name: "Fried Rice & Plantain", vendor: "Campus Bites", price: "₦2,200", rating: "4.7", emoji: "🍛" },
    { name: "Beans & Plantain", vendor: "The Food Hub", price: "₦1,500", rating: "4.5", emoji: "🫘" },
  ];

  const healthTips = dbTips.length > 0 ? dbTips.map((t: any) => ({
    tip: t.content, icon: t.category === "hydration" ? "💧" : t.category === "nutrition" ? "🥗" : "🌅",
  })) : [
    { tip: "Stay hydrated — drink at least 8 glasses of water daily for better focus.", icon: "💧" },
    { tip: "Add vegetables to every meal for a balanced diet and more energy.", icon: "🥗" },
    { tip: "Eating breakfast boosts your metabolism and helps you concentrate in class.", icon: "🌅" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 md:px-8 py-5 max-w-7xl mx-auto">
        <LogoPlaceholder size="sm" />
        <nav className="hidden md:flex items-center gap-8">
          <a href="/how-it-works" className="text-sm font-body font-medium text-foreground hover:text-primary transition-colors">How it works</a>
          <a href="#ecosystem" className="text-sm font-body font-medium text-foreground hover:text-primary transition-colors">Ecosystem</a>
          <a href="#group-buy" className="text-sm font-body font-medium text-foreground hover:text-primary transition-colors">Group Buy</a>
          <a href="#health-tips" className="text-sm font-body font-medium text-foreground hover:text-primary transition-colors">Health Tips</a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={() => navigate(`/dashboard/${role === "buyer" ? "student" : role}`)} className="btn-gold text-sm px-6 py-2.5">
              Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate("/login")} className="text-sm font-body font-medium text-foreground hover:text-primary transition-colors">
                Log in
              </button>
              <button onClick={() => navigate("/signup/student")} className="btn-gold text-sm px-6 py-2.5">
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      <section className="hero-gradient relative overflow-hidden">
        <main className="flex flex-col lg:flex-row items-center justify-between px-6 pt-16 pb-24 max-w-7xl mx-auto gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-body font-semibold text-foreground">Campus Food Ecosystem</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-foreground">
              The Future of{" "}
              <span className="gradient-text">Campus Food.</span>
            </h1>
            <p className="mt-6 text-muted-foreground font-body text-base md:text-lg max-w-xl mx-auto lg:mx-0">
              A smart food marketplace connecting students, vendors, farmers, and riders. Order meals, join group buys, and get delivered fresh — all on campus.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <button onClick={() => navigate("/signup/student")} className="btn-gold text-base px-10 py-4">
                Order Food <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
              <button onClick={() => navigate("/signup/vendor")} className="btn-purple text-base px-10 py-4">
                Merchant Portal
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex-1 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl scale-110" />
              <motion.img
                src={jollofImg}
                alt="Delicious Jollof Rice and Egusi Soup"
                className="relative w-72 md:w-96 drop-shadow-2xl"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </main>
      </section>

      {/* Featured Meals */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-foreground">Featured Meals</h2>
          <p className="text-muted-foreground font-body mt-2">Popular dishes from top campus vendors</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredMeals.map((meal, i) => (
            <motion.div
              key={meal.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="geo-card p-5 cursor-pointer"
            >
              <div className="text-5xl mb-3">{meal.emoji}</div>
              <h3 className="font-display font-semibold text-foreground">{meal.name}</h3>
              <p className="text-xs text-muted-foreground font-body">{meal.vendor}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-display font-bold text-foreground">{meal.price}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-xs font-body text-muted-foreground">{meal.rating}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ecosystem / Roles */}
      <section id="ecosystem" className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-foreground">Join the Ecosystem</h2>
            <p className="text-muted-foreground font-body mt-2">Choose your role in the Bukks platform</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { id: "student", icon: ShoppingBag, title: "Buyer", desc: "Browse food, order meals, join group buys, and track deliveries", color: "bg-primary/10 text-primary" },
              { id: "vendor", icon: Utensils, title: "Vendor", desc: "List your menu, receive orders, and grow your food business", color: "bg-secondary/10 text-secondary" },
              { id: "farmer", icon: Sprout, title: "Farmer", desc: "Sell fresh produce directly to campus vendors and students", color: "bg-success/10 text-success" },
              { id: "rider", icon: Bike, title: "Rider", desc: "Deliver orders across campus and earn on your schedule", color: "bg-primary/10 text-primary" },
            ].map((role, i) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/signup/${role.id}`)}
                className="geo-card p-6 text-left group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${role.color}`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{role.title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{role.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Group Buy */}
      <section id="group-buy" className="max-w-7xl mx-auto px-6 py-20">
        <div className="geo-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1">
            <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-1.5 mb-4">
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-xs font-body font-semibold text-secondary">Group Buy</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">Buy Together, Save More</h2>
            <p className="text-muted-foreground font-body mb-6">
              Pool orders with fellow students to unlock group discounts. The more people join, the cheaper it gets. A countdown timer shows you when the deal closes.
            </p>
            <div className="flex gap-6">
              {[
                { label: "Participants", value: "5-50" },
                { label: "Avg. Savings", value: "30%" },
                { label: "Timer", value: "24h" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display text-2xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground font-body">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 flex justify-center">
            <div className="w-64 h-64 rounded-3xl bg-muted/50 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-secondary mx-auto mb-3" />
                <p className="font-display text-lg font-bold text-foreground">Join a Group</p>
                <p className="text-xs text-muted-foreground font-body mt-1">12 people waiting</p>
                <div className="mt-3 flex items-center gap-1 justify-center">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-body text-primary font-semibold">18:42:30 left</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Health Tips */}
      <section id="health-tips" className="bg-muted/30 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-foreground">Daily Health Tips</h2>
            <p className="text-muted-foreground font-body mt-2">Stay healthy with daily food & nutrition advice</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {healthTips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="geo-card p-6"
              >
                <span className="text-3xl mb-3 block">{tip.icon}</span>
                <p className="text-sm text-foreground font-body leading-relaxed">{tip.tip}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Summary */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground font-body mt-2">Simple steps to get started</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { step: "1", title: "Sign Up", desc: "Create your account as a buyer, vendor, farmer, or rider" },
            { step: "2", title: "Browse & Order", desc: "Find meals, produce, or delivery gigs on campus" },
            { step: "3", title: "Pay Securely", desc: "Quick payment via Paystack integration" },
            { step: "4", title: "Get Delivered", desc: "Riders pick up and deliver right to your location" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-display text-xl font-bold">
                {item.step}
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <button onClick={() => navigate("/how-it-works")} className="text-sm font-body font-semibold text-secondary hover:underline">
            Learn more about how Bukks works <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </section>

      <Footer />
      <SupportButton />
    </div>
  );
};

export default Index;
