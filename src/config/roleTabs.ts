import {
  Home,
  Compass,
  ReceiptText,
  User,
  LayoutDashboard,
  Package,
  Store,
  Sprout,
  Inbox,
  Tractor,
  Bike,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import type { TabItem } from "@/components/RoleTabBar";

export interface RoleTab extends TabItem {
  /** activeNav value understood by DashboardPage's content renderer */
  nav: string;
}

export const roleTabs: Record<string, RoleTab[]> = {
  student: [
    { key: "home", label: "Home", icon: Home, nav: "Overview" },
    { key: "explore", label: "Explore", icon: Compass, nav: "Browse Food" },
    { key: "orders", label: "Orders", icon: ReceiptText, nav: "My Orders" },
    { key: "you", label: "You", icon: User, nav: "Settings" },
  ],
  vendor: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, nav: "Overview" },
    { key: "orders", label: "Orders", icon: Package, nav: "Orders" },
    { key: "products", label: "Products", icon: ShoppingBag, nav: "Manage Menu" },
    { key: "business", label: "Business", icon: Store, nav: "Settings" },
  ],
  farmer: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, nav: "Overview" },
    { key: "produce", label: "Produce", icon: Sprout, nav: "Upload Produce" },
    { key: "requests", label: "Requests", icon: Inbox, nav: "Orders" },
    { key: "farm", label: "Farm", icon: Tractor, nav: "Settings" },
  ],
  rider: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, nav: "Overview" },
    { key: "deliveries", label: "Deliveries", icon: Bike, nav: "Available Deliveries" },
    { key: "earnings", label: "Earnings", icon: Wallet, nav: "Earnings" },
    { key: "you", label: "You", icon: User, nav: "Settings" },
  ],
};

/** Maps an auth role to the shell key used for tabs and routing. */
export const shellRole = (role?: string | null) =>
  role === "buyer" || role === "student" ? "student" : role || "";
