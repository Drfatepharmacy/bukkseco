import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ArrowRight,
  Star,
  Zap,
  Clock,
  ShieldCheck,
  Users,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import jollofImg from "@/assets/jollof-egusi.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { tenant } = useTenant();
  const { scrollYProgress } = useScroll();

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Immersive Hero Section */}
      <section className="relative h-[110vh] flex items-center justify-center overflow-hidden hero-experiment">
        <motion.div
          style={{ opacity }}
          className="absolute inset-0 z-0"
        >
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-[120px] animate-pulse-glow" />
        </motion.div>

        <div className="container relative z-10 px-6">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-8"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold tracking-wider uppercase">{tenant?.name || 'Bukks Ecosystem'}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
              className="text-6xl md:text-8xl lg:text-9xl font-bold leading-[0.9] tracking-tighter mb-8"
            >
              Crave it. <br />
              <span className="gradient-text">Bukks it.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 font-body"
            >
              The premium commerce operating system for {tenant?.name || 'your campus'}. Fast, reliable, and AI-powered.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => navigate("/marketplace")}
                className="btn-gold text-lg px-12 py-5 group"
              >
                Start Ordering
                <ChevronRight className="w-5 h-5 ml-2 inline transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("/signup/vendor")}
                className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-semibold rounded-xl px-12 py-5 transition-all"
              >
                Become a Merchant
              </button>
            </motion.div>
          </div>
        </div>

        <motion.div
          style={{ y: y1 }}
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-4xl opacity-50 pointer-events-none"
        >
          <img src={jollofImg} alt="Hero" className="w-full drop-shadow-[0_0_50px_rgba(255,215,0,0.2)]" />
        </motion.div>
      </section>

      {/* Modern Marketplace Preview */}
      <section className="py-32 container px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Curated for your lifestyle.</h2>
            <p className="text-muted-foreground text-lg">We've partnered with the best vendors on campus to bring you fresh meals and essentials in minutes.</p>
          </div>
          <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5 font-bold h-14 px-8 text-lg" onClick={() => navigate("/marketplace")}>
            Explore all <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Night Delivery", desc: "Late night study session? We've got you covered until 3 AM.", icon: Clock, color: "text-purple" },
            { name: "Verified Vendors", desc: "Every kitchen is vetted for quality and hygiene standards.", icon: ShieldCheck, color: "text-primary" },
            { name: "Group Savings", desc: "Join friends to unlock exclusive campus-wide discounts.", icon: Users, color: "text-success" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="premium-card p-10"
            >
              <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-8 ${feature.color}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.name}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* App Stats Section */}
      <section className="bg-dark py-32 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="container relative z-10 px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: "Active Users", value: "15k+" },
              { label: "Campus Vendors", value: "200+" },
              { label: "Meals Delivered", value: "500k+" },
              { label: "Avg. Delivery Time", value: "18m" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl md:text-6xl font-bold mb-2 gradient-text-gold">{stat.value}</div>
                <div className="text-white/40 uppercase tracking-widest text-xs font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 container px-6">
        <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <h2 className="text-4xl md:text-7xl font-bold mb-8 tracking-tighter">Ready to experience <br />the future?</h2>
          <button
            onClick={() => navigate("/signup/student")}
            className="bg-dark text-white px-16 py-6 rounded-2xl text-xl font-bold hover:scale-105 transition-transform"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default Index;
