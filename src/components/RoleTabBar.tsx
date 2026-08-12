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

/**
 * Fixed bottom navigation integrated into the app shell.
 * Flush to the viewport edge, full width, safe-area aware, quiet by design.
 */
const RoleTabBar = ({ items, active, onSelect }: RoleTabBarProps) => (
  <nav
    aria-label="Primary"
    className="fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur-md border-t border-border"
    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
  >
    <ul className="flex items-stretch w-full max-w-3xl mx-auto">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <li key={item.key} className="flex-1">
            <button
              type="button"
              onClick={() => onSelect(item.key)}
              aria-current={isActive ? "page" : undefined}
              className={`relative w-full h-14 flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  className="absolute top-0 h-0.5 w-10 rounded-full bg-primary"
                />
              )}
              <item.icon className="w-5 h-5" />
              <span className="font-body text-[11px] font-medium leading-none">{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);

export default RoleTabBar;
