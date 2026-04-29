import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { MainLayout } from "@/components/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import StudentDashboard from "./pages/StudentDashboard.tsx";
import HowItWorksPage from "./pages/HowItWorksPage.tsx";
import SupportPage from "./pages/SupportPage.tsx";
import WalletPage from "./pages/WalletPage.tsx";
import FounderConsolePage from "./pages/FounderConsolePage.tsx";
import NotFound from "./pages/NotFound.tsx";
import LiveTrackingPage from "./pages/LiveTrackingPage.tsx";
import VendorStorefrontPage from "./pages/VendorStorefrontPage.tsx";
import VendorDashboard from "./pages/vendor/VendorDashboard.tsx";
import VendorMenu from "./pages/vendor/VendorMenu.tsx";
import VendorOrders from "./pages/vendor/VendorOrders.tsx";
import VendorSales from "./pages/vendor/VendorSales.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminVendors from "./pages/admin/AdminVendors.tsx";
import AdminOrders from "./pages/admin/AdminOrders.tsx";
import RiderDashboard from "./pages/rider/RiderDashboard.tsx";
import Placeholder from "./pages/Placeholder.tsx";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

console.log("APP START");
console.log("Environment check:", {
  url: import.meta.env.VITE_SUPABASE_URL ? "Set" : "Missing",
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "Set" : "Missing",
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TenantProvider>
            <AuthProvider>
              <CartProvider>
                <MainLayout>
                  <Routes>
                  <Route path="/" element={<Index />} />
                <Route path="/signup/:role" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard/student"
                  element={
                    <ProtectedRoute allowedRoles={["buyer"]}>
                  <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
            <Route
              path="/dashboard/vendor"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <DashboardPage role="vendor" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/rider"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  <RiderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/farmer"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <DashboardPage role="farmer" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardPage role="admin" />
                </ProtectedRoute>
              }
            />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            } />
            <Route path="/live-tracking" element={
              <ProtectedRoute>
                <LiveTrackingPage />
              </ProtectedRoute>
            } />
            <Route
              path="/founder-console"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <FounderConsolePage />
                </ProtectedRoute>
              }
            />
            {/* Vendor Routes */}
            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/menu"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/orders"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/sales"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorSales />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vendors"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminVendors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />

                    <Route path="/vendor/:id" element={<VendorStorefrontPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MainLayout>
              </CartProvider>
            </AuthProvider>
          </TenantProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
