import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Store, Sprout, Bike, Shield } from "lucide-react";
import ShaderBackground from "@/components/ShaderBackground";
import LogoPlaceholder from "@/components/LogoPlaceholder";
import RoleCard from "@/components/RoleCard";

const roles = [
  { id: "student", title: "Student", description: "Browse food, order meals, and track deliveries on campus", icon: GraduationCap },
  { id: "vendor", title: "Vendor", description: "List your menu, receive orders, and grow your food business", icon: Store },
  { id: "farmer", title: "Farmer", description: "Sell fresh produce directly to campus vendors and students", icon: Sprout },
  { id: "rider", title: "Rider", description: "Deliver orders across campus and earn on your schedule", icon: Bike },
  { id: "admin", title: "Admin", description: "Manage the entire platform, approvals, and analytics", icon: Shield },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <ShaderBackground />

      {/* Overlay gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background pointer-events-none z-[1]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <LogoPlaceholder size="md" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground font-body"
          >
            Campus Marketplace
          </motion.div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="text-center mb-12 max-w-2xl"
          >
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 tracking-tight">
              <span className="text-foreground">Your Campus,</span>
              <br />
              <span className="gradient-text">Delivered.</span>
            </h1>
            <p className="text-lg text-muted-foreground font-body max-w-md mx-auto">
              Food, fresh produce, and everything in between — ordered, tracked, and delivered across campus.
            </p>
          </motion.div>

          {/* Role Selection */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-4xl"
          >
            <p className="text-sm text-muted-foreground font-body text-center mb-6">Choose your role to get started</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role, i) => (
                <RoleCard
                  key={role.id}
                  title={role.title}
                  description={role.description}
                  icon={role.icon}
                  delay={0.1 * i}
                  onClick={() => navigate(`/signup/${role.id}`)}
                />
              ))}
            </div>
          </motion.div>

          {/* Floating orbs */}
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-secondary/5 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "1.5s" }} />
        </main>
      </div>
    </div>
  );
};

export default Index;
