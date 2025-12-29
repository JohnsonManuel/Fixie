import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import Dashboard from "./Dashboard"; // your existing dashboard component
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "../contexts/ThemeContext";

function ProtectedDashboardContent() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [ organizationKey, setOrganizationKey ] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRole = async () => {
      if (!user) {
        setLoadingRole(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "user");
          setOrganizationKey(data.organizationKey)
          console.log("Loaded user role before dashboard:", data.role);
        } else {
          setRole("user");
        }
      } catch (err) {
        console.error("Failed to load user role:", err);
        setRole("user");
      } finally {
        setLoadingRole(false);
      }
    };

    if (!loading) loadRole();
  }, [user, loading]);

  // ⏳ Show loading state while fetching
  if (loading || loadingRole) {
    return (
      <div className="loading-container fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="loading-spinner mb-4"></div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading your account...</p>
      </div>
    );
  }

  // 🚪 If no user after loading is complete, show auth error
  if (!user) {
    return (
      <div className="auth-error">
        <h2>Authentication Error</h2>
        <p>You must be logged in to access the dashboard.</p>
        <button onClick={() => navigate("/login")} className="login-btn">
          Go to Login
        </button>
      </div>
    );
  }

  // 🔐 Optionally route based on role
  if (role === "admin") {
    // You can also redirect here if desired
    // navigate("/organization-setup");
    console.log("Admin logged in");
  }

  // ✅ Render dashboard once role is ready
  return <Dashboard userRole={role} organizationKey={organizationKey} />;
}

export default function ProtectedDashboard() {
  return (
    <ThemeProvider>
      <ProtectedDashboardContent />
    </ThemeProvider>
  );
}
