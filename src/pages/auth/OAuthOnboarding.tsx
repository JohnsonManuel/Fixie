import React, { useState } from "react";
import Layout from "../Layout";
import fixieLogo from "../../images/image.png";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "../../components/layout/ThemeToggle";

interface OAuthOnboardingState {
  uid: string;
  email: string;
  displayName: string | null;
}

const OAuthOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const db = getFirestore();
  const { logout } = useAuth();

  const state = location.state as OAuthOnboardingState | null;

  const [username, setUsername] = useState(state?.displayName || "");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // If no OAuth state was passed, redirect to login
  if (!state?.uid || !state?.email) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setFormError("Please enter a username.");
      return;
    }

    setIsLoading(true);
    setFormError("");

    try {
      const domain = state.email.split("@")[1].toLowerCase();
      const organizationKey = domain.split(".")[0];

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
            setFormError(
              "This organization already has an admin. Please sign up as a standard user."
            );
            setIsLoading(false);
            return;
          }
        }
      }

      await setDoc(doc(db, "users", state.uid), {
        email: state.email,
        username: username.trim(),
        role,
        verified: true,
        profileComplete: false,
        orgDomain: domain,
        organizationKey,
        createdAt: new Date().toISOString(),
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8fafc] dark:bg-neutral-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/30 rounded-full blur-[80px] animate-pulse delay-1000"></div>

        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-50">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors font-medium group text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-50">
          <ThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-[580px] px-4 sm:px-6 flex flex-col items-center py-6 sm:py-10">
          <div className="flex items-center space-x-3 mb-6 sm:mb-8">
            <img src={fixieLogo} alt="Fixie Logo" className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] object-contain" />
            <span className="font-bold text-2xl sm:text-4xl text-neutral-900 dark:text-white tracking-tight">
              Fixie
            </span>
          </div>

          <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-[20px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none p-5 sm:p-10">
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">
                Almost there!
              </h2>
              <p className="text-xs sm:text-base text-neutral-500 dark:text-neutral-400 font-medium">
                Just a few more details to set up your account
              </p>
            </div>

            {formError && (
              <div className="mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-xs sm:text-sm font-semibold text-center">
                {formError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email - read only */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={state.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                />
              </div>

              {/* Username - pre-filled but editable */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="johndoe"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                  What's your role?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`p-3 rounded-xl border transition-all text-xs font-bold ${
                      role === "user"
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/10"
                        : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`p-3 rounded-xl border transition-all text-xs font-bold ${
                      role === "admin"
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
                  disabled={isLoading}
                  className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold text-base hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></div>
                      Setting up...
                    </div>
                  ) : (
                    "Get Started"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OAuthOnboarding;
