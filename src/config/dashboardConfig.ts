import {
  LayoutDashboard, ShoppingBag, Truck, Wallet, Star, Clock,
  Package, BarChart3, Settings, Users, CheckCircle, AlertTriangle,
  Utensils, Sprout, MapPin, History, TrendingUp, Bike,
  MessageCircle, CalendarDays, Megaphone, LifeBuoy, Ticket
} from "lucide-react";

const weeklyData = [
  { label: "Mon", value: 120 },
  { label: "Tue", value: 180 },
  { label: "Wed", value: 95 },
  { label: "Thu", value: 220 },
  { label: "Fri", value: 310 },
  { label: "Sat", value: 260 },
  { label: "Sun", value: 150 },
];

const monthlyRevenue = [
  { label: "Jan", value: 4500 },
  { label: "Feb", value: 5200 },
  { label: "Mar", value: 6100 },
  { label: "Apr", value: 4800 },
  { label: "May", value: 7300 },
  { label: "Jun", value: 8900 },
];

export const dashboardConfigs: Record<string, {
  label: string;
  stats: { title: string; value: number; prefix?: string; suffix?: string; icon: any; trend?: number; color?: "primary" | "secondary" | "success" }[];
  navItems: { label: string; icon: any }[];
  charts: { title: string; data: { label: string; value: number }[]; color?: "primary" | "secondary" | "success" }[];
}> = {
  student: {
    label: "Student Dashboard",
    stats: [
      { title: "Orders This Month", value: 23, icon: ShoppingBag, trend: 12, color: "primary" },
      { title: "Active Deliveries", value: 2, icon: Truck, trend: 5, color: "secondary" },
      { title: "Average Rating", value: 4, suffix: ".8", icon: Star, color: "primary" },
      { title: "Savings", value: 3200, prefix: "₦", icon: TrendingUp, color: "success" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Browse Food", icon: Utensils },
      { label: "Farm Produce", icon: Sprout },
      { label: "My Orders", icon: ShoppingBag },
      { label: "Reservations", icon: CalendarDays },
      { label: "Campus Feed", icon: Megaphone },
      { label: "Messages", icon: MessageCircle },
      { label: "Track Delivery", icon: Truck },
      { label: "Support", icon: LifeBuoy },
      { label: "Wallet", icon: Wallet },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Orders This Week", data: weeklyData, color: "primary" },
      { title: "Spending Trend", data: monthlyRevenue, color: "secondary" },
    ],
  },
  vendor: {
    label: "Vendor Dashboard",
    stats: [
      { title: "Total Revenue", value: 342500, prefix: "₦", icon: TrendingUp, trend: 18, color: "success" },
      { title: "Active Orders", value: 8, icon: Package, trend: 3, color: "primary" },
      { title: "Menu Items", value: 24, icon: Utensils, color: "secondary" },
      { title: "Customer Rating", value: 4, suffix: ".6", icon: Star, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Manage Menu", icon: Utensils },
      { label: "Orders", icon: Package },
      { label: "Reservations", icon: CalendarDays },
      { label: "Messages", icon: MessageCircle },
      { label: "Support", icon: LifeBuoy },
      { label: "Revenue", icon: TrendingUp },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Orders This Week", data: weeklyData, color: "primary" },
      { title: "Monthly Revenue", data: monthlyRevenue, color: "success" },
    ],
  },
  farmer: {
    label: "Farmer Dashboard",
    stats: [
      { title: "Revenue", value: 187000, prefix: "₦", icon: TrendingUp, trend: 22, color: "success" },
      { title: "Active Stock", value: 42, icon: Sprout, color: "primary" },
      { title: "Bulk Orders", value: 6, icon: Package, trend: 8, color: "secondary" },
      { title: "Deliveries Scheduled", value: 3, icon: Truck, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Upload Produce", icon: Sprout },
      { label: "Manage Stock", icon: Package },
      { label: "Messages", icon: MessageCircle },
      { label: "Support", icon: LifeBuoy },
      { label: "Delivery Schedule", icon: Truck },
      { label: "Revenue", icon: TrendingUp },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Produce Sales", data: weeklyData, color: "success" },
      { title: "Revenue Trend", data: monthlyRevenue, color: "primary" },
    ],
  },
  rider: {
    label: "Rider Dashboard",
    stats: [
      { title: "Earnings Today", value: 4200, prefix: "₦", icon: Wallet, trend: 15, color: "success" },
      { title: "Deliveries Today", value: 12, icon: Truck, trend: 8, color: "primary" },
      { title: "Active Delivery", value: 1, icon: MapPin, color: "secondary" },
      { title: "Rating", value: 4, suffix: ".9", icon: Star, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Available Deliveries", icon: Package },
      { label: "Browse Food", icon: Utensils },
      { label: "Messages", icon: MessageCircle },
      { label: "Support", icon: LifeBuoy },
      { label: "Navigation", icon: MapPin },
      { label: "Earnings", icon: Wallet },
      { label: "Delivery History", icon: History },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Deliveries This Week", data: weeklyData, color: "secondary" },
      { title: "Earnings Trend", data: monthlyRevenue, color: "success" },
    ],
  },
  admin: {
    label: "Admin Panel",
    stats: [
      { title: "Total Users", value: 2847, icon: Users, trend: 14, color: "primary" },
      { title: "Platform Revenue", value: 1250000, prefix: "₦", icon: TrendingUp, trend: 22, color: "success" },
      { title: "Pending Approvals", value: 15, icon: AlertTriangle, color: "secondary" },
      { title: "Active Orders", value: 89, icon: Package, trend: 7, color: "primary" },
    ],
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Approve Vendors", icon: CheckCircle },
      { label: "Approve Farmers", icon: Sprout },
      { label: "Verify Riders", icon: Bike },
      { label: "Monitor Orders", icon: Package },
      { label: "Campus Feed", icon: Megaphone },
      { label: "Analytics", icon: BarChart3 },
      { label: "Support Tickets", icon: Ticket },
      { label: "Disputes", icon: AlertTriangle },
      { label: "Payouts", icon: Wallet },
      { label: "Settings", icon: Settings },
    ],
    charts: [
      { title: "Platform Orders", data: weeklyData, color: "primary" },
      { title: "Revenue Growth", data: monthlyRevenue, color: "success" },
    ],
  },
};
