import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, ChevronLeft, LogOut } from "lucide-react";
import LogoPlaceholder from "./LogoPlaceholder";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

interface NavItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
}

interface DashboardSidebarProps {
  items: NavItem[];
  role: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

const DashboardSidebar = ({ items, role, collapsed, onToggle }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);

  // Click-outside collapses on mobile (< md, 768px)
  useEffect(() => {
    if (collapsed) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (window.innerWidth >= 768) return;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle?.();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [collapsed, onToggle]);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        ref={ref}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-30 transition-all duration-300 ${
          collapsed ? "w-20 -translate-x-full md:translate-x-0" : "w-64"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          {!collapsed && (
            <span className="font-display font-bold text-xl text-primary">bukks</span>
          )}
          <button onClick={onToggle} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground">
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-body">{role}</span>
          </div>
        )}

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick?.();
                if (window.innerWidth < 768) onToggle?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                item.active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-body">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="font-body">Back to Home</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default DashboardSidebar;
