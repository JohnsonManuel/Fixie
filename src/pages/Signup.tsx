import React, { useState } from "react";
import "../styles/Signup.css";
import { useAuth } from "../hooks/useAuth";
import fixieLogo from "../images/image.png";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";

const SignupAdmin: React.FC = () => {
  const { signUp } = useAuth(); // use the standard signUp; we’ll add admin logic here
  const navigate = useNavigate();
  const db = getFirestore();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (formError) setFormError("");
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

      // 2️⃣ Send verification email
      await sendEmailVerification(user);

      // 3️⃣ Store admin metadata in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: formData.username,
        role: "admin",
        verified: false,
        profileComplete: false,
        createdAt: new Date().toISOString(),
      });

      // 4️⃣ Show success message
      setSuccessMessage(
        `A verification email has been sent to ${user.email}. Please verify before continuing.`
      );
    } catch (err: any) {
      setFormError(err.message);
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
            <h1>Tech Admin Sign-Up</h1>
            <p>Register your organization’s admin account</p>
          </div>

          {/* Error / Success Messages */}
          {formError && <div className="error-message">{formError}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {/* Signup Form */}
          {successMessage === '' &&
            (
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

            <button type="submit" className="signup-btn" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Admin Account"}
            </button>
          </form>
            )
          }

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
