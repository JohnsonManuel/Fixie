import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import LandingPage from "./pages/LandingPage";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ServiceNowAlternative from "./pages/ServiceNowAlternative";
import EnterpriseITSM from "./pages/EnterpriseITSM";
import ServiceNowMigration from "./pages/ServiceNowMigration";
import Fortune500ITSM from "./pages/Fortune500ITSM";
import DemoForm from "./components/DemoForm";
import OrganizationSetup from "./pages/OrganizationSetup"; // you'll build this next
import SignupAdmin from "./pages/SignupAdmin";

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
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signupadmin" element={<SignupAdmin />} />
        <Route path="/demo" element={<DemoForm onBackToHome={() => window.location.href = '/'} />} />
        {/* <Route path="/servicenow-alternative" element={<ServiceNowAlternative />} />
        <Route path="/enterprise-itsm" element={<EnterpriseITSM />} />
        <Route path="/servicenow-migration" element={<ServiceNowMigration />} />
        <Route path="/fortune500-itsm" element={<Fortune500ITSM />} /> */}

        {/* Protected routes */}
        <Route
          path="/organization-setup"
          element={
            <ProtectedRoute>
              <OrganizationSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
