import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LogoPlaceholder from "@/components/LogoPlaceholder";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <LogoPlaceholder size="sm" />
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm font-body font-medium text-foreground hover:text-primary transition-colors">How it works</a>
          <a href="#ecosystem" className="text-sm font-body font-medium text-foreground hover:text-primary transition-colors">Ecosystem</a>
        </nav>
        <button
          onClick={() => navigate("/signup/student")}
          className="bg-secondary text-secondary-foreground font-body font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity"
        >
          Get Started
        </button>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight text-foreground"
        >
          The Future of{" "}
          <span className="gradient-text">Campus Logistics.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 text-muted-foreground font-body text-base md:text-lg max-w-xl"
        >
          A 2026 production-grade food supply ecosystem connecting farmers, vendors, students, and riders in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          <button
            onClick={() => navigate("/signup/student")}
            className="bg-primary text-primary-foreground font-body font-semibold text-base px-10 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Order Food
          </button>
          <button
            onClick={() => navigate("/signup/vendor")}
            className="border-2 border-border text-foreground font-body font-semibold text-base px-10 py-4 rounded-full hover:border-primary hover:text-primary transition-all duration-200"
          >
            Merchant Portal
          </button>
        </motion.div>

        {/* Warm glow behind CTA */}
        <div className="absolute left-1/2 -translate-x-1/2 mt-[-40px] w-96 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </main>

      {/* Roles Section */}
      <section id="ecosystem" className="max-w-6xl mx-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-bold text-foreground text-center mb-10"
        >
          Join the Ecosystem
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { id: "student", emoji: "🎓", title: "Student", desc: "Browse food, order meals, and track deliveries on campus" },
            { id: "vendor", emoji: "🍳", title: "Vendor", desc: "List your menu, receive orders, and grow your food business" },
            { id: "farmer", emoji: "🌾", title: "Farmer", desc: "Sell fresh produce directly to campus vendors and students" },
            { id: "rider", emoji: "🏍️", title: "Rider", desc: "Deliver orders across campus and earn on your schedule" },
            { id: "admin", emoji: "🛡️", title: "Admin", desc: "Manage the entire platform, approvals, and analytics" },
          ].map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/signup/${role.id}`)}
              className="glass-card-hover p-6 text-left group"
            >
              <span className="text-3xl mb-3 block">{role.emoji}</span>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{role.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{role.desc}</p>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
