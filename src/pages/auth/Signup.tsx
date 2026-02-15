import React, { useState } from "react";
import Layout from "../Layout";
import "../../styles/Signup.css";
import { useAuth } from "../../hooks/useAuth";
import fixieLogo from "../../images/image.png";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";

import ThemeToggle from "../../components/layout/ThemeToggle";

const Signup: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [role, setRole] = useState<"admin" | "user">("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorFields, setErrorFields] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (formError) setFormError("");
    if (errorFields.includes(e.target.name)) {
      setErrorFields(errorFields.filter((f) => f !== e.target.name));
    }
    // Specific check for confirmPassword when password changes
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      if (errorFields.includes("confirmPassword")) {
        setErrorFields(errorFields.filter((f) => f !== "confirmPassword"));
      }
    }
  };

  const validateForm = () => {
    const newErrorFields: string[] = [];
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      newErrorFields.push("confirmPassword");
      setErrorFields(newErrorFields);
      return false;
    }
    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      newErrorFields.push("password");
      setErrorFields(newErrorFields);
      return false;
    }
    setErrorFields([]);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setFormError("");
    setSuccessMessage("");
    setErrorFields([]);

    try {
      const result = await signUp(formData.email, formData.password);
      const user = result.user;
      await user.getIdToken(true);
      await new Promise((r) => setTimeout(r, 200));

      const domain = formData.email.split("@")[1].toLowerCase();

      if (role === "admin") {
        const orgRef = collection(db, "organizations");
        const q = query(orgRef, where("domain", "==", domain));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const orgData = snapshot.docs[0].data();
          let hasAdmin = false;
          if (orgData.adminUid) {
            hasAdmin = true;
          } else if (orgData.members && typeof orgData.members === "object") {
            hasAdmin = Object.values(orgData.members).some(
              (m: any) => m.role === "admin"
            );
          }

          if (hasAdmin) {
            await user.delete();
            throw new Error(
              "This organization already has an admin. Please sign up as a standard user."
            );
          }
        }
      }

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: formData.username,
        role,
        verified: false,
        profileComplete: false,
        orgDomain: domain,
        organizationKey: domain.split(".")[0],
        createdAt: new Date().toISOString(),
      });

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

  const handleBackClick = () => {
    navigate("/");
  };

  return (
    <Layout showNavbar={false}>
      <div className="signup-page-v2 min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8fafc] dark:bg-neutral-950">
        {/* Background Gradients - Centered cluster */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/30 rounded-full blur-[80px] animate-pulse delay-1000"></div>

        {/* Back to Home Button */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-50">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors font-medium group text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">Back to Home</span>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-50">
          <ThemeToggle />
        </div>

        {/* Signup Container (Centered) */}
        <div className="relative z-10 w-full max-w-[580px] px-4 sm:px-6 flex flex-col items-center py-6 sm:py-10">
          {/* Header Outside Card */}
          <div className="flex items-center space-x-3 mb-6 sm:mb-8">
            <img
              src={fixieLogo}
              alt="Fixie Logo"
              className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] object-contain"
            />
            <span className="font-bold text-2xl sm:text-4xl text-neutral-900 dark:text-white tracking-tight">
              Fixie
            </span>
          </div>

          <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-[20px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none p-5 sm:p-10">
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">
                Create Account
              </h2>
              <p className="text-xs sm:text-base text-neutral-500 dark:text-neutral-400 font-medium">
                Join our AI platform today
              </p>
            </div>

            {/* Error / Success Messages */}
            {formError && (
              <div className="error-message mb-6 animate-shake text-center p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl sm:rounded-2xl border border-red-100 dark:border-red-900/30 text-xs sm:text-sm font-semibold">
                {formError}
              </div>
            )}
            {successMessage && (
              <div className="success-message mb-6 text-center p-5 sm:p-6 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl sm:rounded-2xl border border-green-100 dark:border-green-900/30 text-sm sm:text-base font-medium">
                {successMessage}
              </div>
            )}

            {/* Signup Form */}
            {!successMessage && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="username"
                      className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="johndoe"
                      className={`w-full px-4 py-3 rounded-xl border ${errorFields.includes("username")
                        ? "border-red-500 bg-red-50/30 dark:bg-red-900/10"
                        : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
                        } text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@company.com"
                      className={`w-full px-4 py-3 rounded-xl border ${errorFields.includes("email")
                        ? "border-red-500 bg-red-50/30 dark:bg-red-900/10"
                        : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
                        } text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl border ${errorFields.includes("password")
                        ? "border-red-500 bg-red-50/30 dark:bg-red-900/10"
                        : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
                        } text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl border ${errorFields.includes("confirmPassword")
                        ? "border-red-500 bg-red-50/30 dark:bg-red-900/10"
                        : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
                        } text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                      required
                    />
                  </div>
                </div>

                {/* Account Type Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                    What's your role?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("user")}
                      className={`p-3 rounded-xl border transition-all text-xs font-bold ${role === "user"
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/10"
                        : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600"
                        }`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`p-3 rounded-xl border transition-all text-xs font-bold ${role === "admin"
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/10"
                        : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600"
                        }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold text-base hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors ml-1"
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
