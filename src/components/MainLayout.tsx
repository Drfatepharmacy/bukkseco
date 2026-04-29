import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {!isMobile && <AppSidebar />}
        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 pb-20 md:pb-0">
            {children}
          </div>
          {isMobile && <BottomNav />}
        </main>
      </div>
    </SidebarProvider>
  );
}
