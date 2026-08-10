import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface RoleTabBarProps {
  items: TabItem[];
  active: string;
  onSelect: (key: string) => void;
}

const RoleTabBar = ({ items, active, onSelect }: RoleTabBarProps) => (
  <nav
    aria-label="Primary"
    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(440px,calc(100%-2rem))]"
  >
    <div className="h-[70px] rounded-3xl bg-sidebar/95 backdrop-blur-xl border border-sidebar-border shadow-2xl flex items-stretch px-2">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            aria-current={isActive ? "page" : undefined}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors"
          >
            {isActive && (
              <motion.span
                layoutId="tab-glow"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-1 rounded-2xl bg-sidebar-accent/25 shadow-[0_0_24px_-4px_hsl(var(--sidebar-accent))]"
              />
            )}
            <motion.span
              animate={{ y: isActive ? -2 : 0 }}
              className={`relative flex flex-col items-center gap-1 ${
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className="font-body text-[11px] font-medium">{item.label}</span>
            </motion.span>
            {isActive && (
              <motion.span
                layoutId="tab-indicator"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute bottom-1.5 h-0.5 w-8 rounded-full bg-primary"
              />
            )}
          </button>
        );
      })}
    </div>
  </nav>
);

export default RoleTabBar;
