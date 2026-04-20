import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import HowItWorksPage from "./pages/HowItWorksPage.tsx";
import SupportPage from "./pages/SupportPage.tsx";
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
import Placeholder from "./pages/Placeholder.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup/:role" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute allowedRoles={["user", "buyer"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/vendor"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/rider"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/farmer"
              element={
                <ProtectedRoute allowedRoles={["farmer"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/live-tracking" element={
              <ProtectedRoute>
                <LiveTrackingPage />
              </ProtectedRoute>
            } />
            <Route
              path="/founder-console"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
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
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vendors"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <AdminVendors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />

              <Route path="/vendor/:id" element={<VendorStorefrontPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
