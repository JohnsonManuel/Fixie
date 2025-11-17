import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import Dashboard from "./Dashboard"; // your existing dashboard component
import { useNavigate } from "react-router-dom";

export default function ProtectedDashboard() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your account...</p>
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
  return <Dashboard userRole={role} />;
}
