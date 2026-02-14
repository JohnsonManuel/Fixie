import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import LandingPage from "./pages/home/LandingPage";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
// import Dashboard from "./pages/dashboard/Dashboard";
// import ServiceNowAlternative from "./pages/product/ServiceNowAlternative";
// import EnterpriseITSM from "./pages/product/EnterpriseITSM";
// import ServiceNowMigration from "./pages/product/ServiceNowMigration";
// import Fortune500ITSM from "./pages/product/Fortune500ITSM";
import DemoForm from "./components/forms/DemoForm";
import OrganizationSetup from "./pages/organization/OrganizationSetup"; // you'll build this next
import SignupAdmin from "./pages/auth/SignupAdmin";
import PricingPage from "./pages/pricing/PricingPage";
import FeaturesPage from "./pages/features/FeaturesPage";
import ContactPage from "./pages/contact/ContactPage";
import ProtectedDashboard from "./pages/dashboard/ProtectedDashboard";
import { ThemeProvider } from "./contexts/ThemeContext";

// 🔒 Protect routes that need authentication
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists but hasn't verified email
  if (!user.emailVerified) {
    return (
      <div className="verify-email-page">
        <h2>Verify your email to continue</h2>
        <p>Please check your inbox and click the verification link.</p>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signupadmin" element={<SignupAdmin />} />
          <Route path="/demo" element={<DemoForm onBackToHome={() => window.location.href = '/'} />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Protected routes */}
          <Route
            path="/organization-setup"
            element={
              <ProtectedRoute>
                <OrganizationSetup />
              </ProtectedRoute>
            }
          />

          <Route path="/dashboard" element={<ProtectedDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
