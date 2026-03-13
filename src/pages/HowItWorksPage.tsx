import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Utensils, Sprout, Bike, Users, Heart, Bell } from "lucide-react";
import Footer from "@/components/Footer";
import SupportButton from "@/components/SupportButton";

const steps = [
  {
    role: "Buyers",
    icon: ShoppingBag,
    color: "bg-primary/10 text-primary",
    steps: ["Create your account", "Browse meals & farm produce", "Join a group buy for discounts", "Pay securely via Paystack", "Track delivery in real-time"],
  },
  {
    role: "Vendors",
    icon: Utensils,
    color: "bg-secondary/10 text-secondary",
    steps: ["Register your food business", "Upload your menu & photos", "Receive and manage orders", "Prepare meals for pickup", "Riders deliver to buyers"],
  },
  {
    role: "Farmers",
    icon: Sprout,
    color: "bg-success/10 text-success",
    steps: ["Register your farm", "List produce with pricing", "Vendors purchase in bulk", "Schedule deliveries", "Track revenue & orders"],
  },
  {
    role: "Riders",
    icon: Bike,
    color: "bg-primary/10 text-primary",
    steps: ["Sign up with vehicle details", "Accept delivery requests", "Pick up from vendors", "Deliver to buyers on campus", "Earn per delivery"],
  },
];

const features = [
  { icon: Users, title: "Group Buying", desc: "Pool orders with other buyers to unlock lower prices on meals and produce." },
  { icon: Heart, title: "Daily Health Tips", desc: "Get daily nutrition advice, hydration reminders, and balanced meal ideas." },
  { icon: Bell, title: "Smart Notifications", desc: "Real-time updates on orders, deliveries, group buy status, and promotions." },
];

const HowItWorksPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            How <span className="gradient-text">Bukks</span> Works
          </h1>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
            A connected ecosystem where buyers, vendors, farmers, and riders work together to deliver fresh, affordable food on campus.
          </p>
        </motion.div>

        {/* Role flows */}
        <div className="space-y-12 mb-20">
          {steps.map((section, i) => (
            <motion.div
              key={section.role}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="geo-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">How {section.role} Use Bukks</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {section.steps.map((step, j) => (
                  <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{j + 1}</span>
                    <span className="text-sm font-body text-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-10">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="geo-card p-6 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-12"
        >
          <h2 className="font-display text-3xl font-bold text-foreground mb-6">Ready to Join?</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => navigate("/signup/student")} className="btn-gold text-base px-10 py-4">Order Food</button>
            <button onClick={() => navigate("/signup/vendor")} className="btn-purple text-base px-10 py-4">Sell Food</button>
            <button onClick={() => navigate("/signup/farmer")} className="btn-gold text-base px-10 py-4">Supply Produce</button>
            <button onClick={() => navigate("/signup/rider")} className="btn-purple text-base px-10 py-4">Deliver Orders</button>
          </div>
        </motion.div>
      </main>

      <Footer />
      <SupportButton />
    </div>
  );
};

export default HowItWorksPage;
