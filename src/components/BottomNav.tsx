import {
  Home,
  ShoppingBag,
  Wallet,
  User,
  MessageSquare
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Market", icon: ShoppingBag, path: "/marketplace" },
    { label: "Wallet", icon: Wallet, path: "/wallet" },
    { label: "Chat", icon: MessageSquare, path: "/messages" },
    { label: "Profile", icon: User, path: "/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-background/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-6 pb-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={cn(
              "bottom-nav-link relative",
              isActive && "active"
            )}
          >
            <item.icon className={cn(
              "w-6 h-6 transition-all duration-300",
              isActive ? "scale-110" : "opacity-60"
            )} />
            <span className="mt-1">{item.label}</span>
            {isActive && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
