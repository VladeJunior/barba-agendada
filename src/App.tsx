import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Booking from "./pages/Booking";
import BarberProfile from "./pages/BarberProfile";
import MyAppointments from "./pages/MyAppointments";
import MyAppointmentsByShop from "./pages/MyAppointmentsByShop";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";

// Dashboard imports
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Services from "./pages/dashboard/Services";
import Products from "./pages/dashboard/Products";
import Team from "./pages/dashboard/Team";
import Schedule from "./pages/dashboard/Schedule";
import Clients from "./pages/dashboard/Clients";
import Reports from "./pages/dashboard/Reports";
import Settings from "./pages/dashboard/Settings";
import Plans from "./pages/dashboard/Plans";
import Loyalty from "./pages/dashboard/Loyalty";
import Sales from "./pages/dashboard/Sales";
import BarberSchedule from "./pages/dashboard/BarberSchedule";
import BarberCommission from "./pages/dashboard/BarberCommission";
import BarberDashboardHome from "./pages/dashboard/BarberDashboardHome";
import CommissionControl from "./pages/dashboard/CommissionControl";

// Admin imports
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminShops from "./pages/admin/AdminShops";
import AdminShopDetail from "./pages/admin/AdminShopDetail";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminMetrics from "./pages/admin/AdminMetrics";
import AdminSupport from "./pages/admin/AdminSupport";
import Support from "./pages/dashboard/Support";

import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import BrandGuide from "./pages/BrandGuide";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/marca" element={<BrandGuide />} />
            <Route path="/agendar/:shopSlug" element={<Booking />} />
            <Route path="/agendar/:shopSlug/barbeiro/:barberId" element={<BarberProfile />} />
            <Route path="/agendar/:shopSlug/meus-agendamentos" element={<MyAppointmentsByShop />} />
            <Route path="/meus-agendamentos" element={<MyAppointments />} />
            <Route path="/aceitar-convite/:token" element={<AcceptInvite />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="services" element={<Services />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<Sales />} />
              <Route path="team" element={<Team />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="clients" element={<Clients />} />
              <Route path="reports" element={<Reports />} />
              <Route path="commissions" element={<CommissionControl />} />
              <Route path="plans" element={<Plans />} />
              <Route path="loyalty" element={<Loyalty />} />
              <Route path="support" element={<Support />} />
              <Route path="settings" element={<Settings />} />
              {/* Barber Routes */}
              <Route path="my-dashboard" element={<BarberDashboardHome />} />
              <Route path="my-schedule" element={<BarberSchedule />} />
              <Route path="my-commission" element={<BarberCommission />} />
            </Route>

            {/* Admin Routes - Super Admin Only */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="shops" element={<AdminShops />} />
              <Route path="shops/:id" element={<AdminShopDetail />} />
              <Route path="billing" element={<AdminBilling />} />
              <Route path="metrics" element={<AdminMetrics />} />
              <Route path="support" element={<AdminSupport />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
}

export default App;
