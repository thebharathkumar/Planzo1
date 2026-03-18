import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppProvider } from "./store";
import { Navbar } from "./components/navbar";
import { EventDiscovery } from "./pages/EventDiscovery";
import { GlobeView } from "./pages/GlobeView";
import { EventDetail } from "./pages/EventDetail";
import { Checkout } from "./pages/Checkout";
import { MyTickets } from "./pages/MyTickets";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";
import { AdminFinanceDashboard } from "./pages/AdminFinanceDashboard";
import { MarketingDashboard } from "./pages/MarketingDashboard";
import { AuthLogin } from "./pages/AuthLogin";
import { AuthRegister } from "./pages/AuthRegister";
import { UserProfile } from "./pages/UserProfile";
import { CustomerSupport } from "./pages/CustomerSupport";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen" style={{ background: "var(--color-bg-base)", color: "var(--color-text-primary)" }}>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<EventDiscovery />} />
              <Route path="/globe" element={<GlobeView />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/admin" element={<AdminFinanceDashboard />} />
              <Route path="/marketing" element={<MarketingDashboard />} />
              <Route path="/login" element={<AuthLogin />} />
              <Route path="/register" element={<AuthRegister />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/support" element={<CustomerSupport />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
