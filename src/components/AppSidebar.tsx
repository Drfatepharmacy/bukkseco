import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  MessageSquare,
  Settings,
  LogOut,
  Bike,
  Utensils,
  Sprout,
  ShieldCheck
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import LogoPlaceholder from "@/components/LogoPlaceholder";

export function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    const common = [
      { title: "Dashboard", icon: LayoutDashboard, path: `/dashboard/${role === 'buyer' ? 'student' : role}` },
      { title: "Messages", icon: MessageSquare, path: "/messages" },
      { title: "Settings", icon: Settings, path: "/settings" },
    ];

    const roleSpecific = {
      buyer: [
        { title: "Marketplace", icon: ShoppingBag, path: "/" },
        { title: "Wallet", icon: Wallet, path: "/wallet" },
      ],
      vendor: [
        { title: "Menu Manager", icon: Utensils, path: "/vendor/menu" },
        { title: "Orders", icon: ShoppingBag, path: "/vendor/orders" },
      ],
      rider: [
        { title: "Deliveries", icon: Bike, path: "/rider/deliveries" },
      ],
      farmer: [
        { title: "Stock Manager", icon: Sprout, path: "/farmer/stock" },
      ],
      admin: [
        { title: "System Approvals", icon: ShieldCheck, path: "/admin/approvals" },
      ]
    };

    return [...common, ...(roleSpecific[role as keyof typeof roleSpecific] || [])];
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="p-6">
        <LogoPlaceholder size="sm" />
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 px-2 py-4 uppercase text-[10px] tracking-widest font-bold">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    className="sidebar-link w-full justify-start gap-3 h-12"
                  >
                    <button onClick={() => navigate(item.path)}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="sidebar-link w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut()}
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
