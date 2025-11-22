import React, { useState } from "react";
import "../styles/Signup.css";
import { useAuth } from "../hooks/useAuth";
import fixieLogo from "../images/image.png";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";

const SignupAdmin: React.FC = () => {

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [role, setRole] = useState<"admin" | "user">("admin"); // 🔹 New: role toggle
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (formError)
      setFormError("");
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsLoading(true);
  setFormError("");
  setSuccessMessage("");

  try {
    // 1️⃣ Create user in Firebase Auth
    const result = await signUp(formData.email, formData.password);
    const user = result.user;

    // 🔄 Refresh token to ensure Firestore sees authentication context
    await user.getIdToken(true);
    await new Promise((r) => setTimeout(r, 200));

    // Extract domain part (for org mapping)
    const domain = formData.email.split("@")[1].toLowerCase();

    // 2️⃣ If signing up as admin, ensure this org doesn't already have an admin
    if (role === "admin") {
      const orgRef = collection(db, "organizations");
      const q = query(orgRef, where("domain", "==", domain));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const orgData = snapshot.docs[0].data();

        const hasAdmin =
          orgData.adminUid ||
          (Array.isArray(orgData.members) &&
            orgData.members.some((m: any) => m.role === "admin"));

        if (hasAdmin) {
          // Optional: clean up the just-created auth user
          await user.delete();

          throw new Error(
            "This organization already has an admin. Please sign up as a standard user."
          );
        }
      }
    }

    // 3️⃣ Send verification email
    await sendEmailVerification(user);

    // 4️⃣ Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      username: formData.username,
      role, // "user" or "admin"
      verified: false,
      profileComplete: false,
      orgDomain: domain,
      organizationKey: domain.split('.')[0],
      createdAt: new Date().toISOString(),
    });

    // 5️⃣ Show success message
    setSuccessMessage(
      `A verification email has been sent to ${user.email}. Please verify your email before logging in.`
    );
  } catch (err: any) {
    console.error("Signup error:", err);
    setFormError(
      err.code === "permission-denied"
        ? "You don’t have permission to perform this action."
        : err.message
    );
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="signup-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo">
              <img src={fixieLogo} alt="Fixie Logo" className="logo-image" />
            </div>
          </div>
          <div className="nav-right">
            <button onClick={() => navigate("/")} className="back-link">
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="signup-container">
        <div className="signup-content">
          <div className="signup-header">
            <h1>Create Your Account</h1>
            <p>Register as an Admin or a Standard User</p>
          </div>

          {/* Error / Success Messages */}
          {formError && <div className="error-message">{formError}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {/* Signup Form */}
          {successMessage === "" && (
            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* 🔹 Role Toggle */}
              <div className="form-group">
                <label>Account Type</label>
                <div className="role-toggle">
                  <label
                    className={`role-chip ${role === "user" ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={role === "user"}
                      onChange={() => setRole("user")}
                      disabled={isLoading}
                    />
                    Standard User
                  </label>
                  <label
                    className={`role-chip ${role === "admin" ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === "admin"}
                      onChange={() => setRole("admin")}
                      disabled={isLoading}
                    />
                    Admin
                  </label>
                </div>
                <small className="helper">
                  Your chosen role will determine your permissions in Fixie.
                </small>
              </div>

              <button type="submit" className="signup-btn" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="signup-footer">
            <p className="login-link">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="link-button"
              >
                Log in
              </button>
            </p>
          </div>
        </div>

        {/* Right Side Visual */}
        <div className="signup-visual">
          <div className="visual-content">
            <div className="visual-logo">
              <img
                src={fixieLogo}
                alt="Fixie AI"
                className="signup-main-logo"
                style={{
                  width: "80px",
                  height: "80px",
                  marginBottom: "20px",
                }}
              />
            </div>
            <h2>Join thousands of teams</h2>
            <p>Building the future of IT support with AI</p>
            <div className="stats">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Companies</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupAdmin;
