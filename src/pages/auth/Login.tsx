import React, { useState } from "react";
import Layout from "../Layout";
import "../../styles/Login.css";
import { useAuth } from "../../hooks/useAuth";
import { LoginProps } from "../../types";
import fixieLogo from "../../images/image.png";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  // arrayUnion,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/layout/ThemeToggle";

function Login({ onBackToHome }: LoginProps) {
  const navigate = useNavigate();
  const db = getFirestore();

  const {
    signIn,
    signInWithGoogle,
    signInWithGithub,
    error,
    clearError,
    logout,
  } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user types
    if (error) clearError();
    if (formError) setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");

    try {
      const { email, password } = formData;

      // 1. Sign in
      const result = await signIn(email, password);
      const user = result.user;

      // 2. Enforce email verification
      if (!user.emailVerified) {
        setFormError("Please verify your email before logging in.");
        await logout();
        setIsLoading(false);
        return;
      }

      // 3. Fetch user's Firestore record (role, organizationKey, etc.)
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setFormError("No user record found. Please contact support.");
        await logout();
        setIsLoading(false);
        return;
      }

      const userData = userSnap.data() as any;
      const userRole = userData.role || "user";
      const organizationKey = userData.organizationKey || null; // e.g. "acme" from "@acme"

      // 4. Look up org by domain
      const domain = email.split("@")[1].toLowerCase();
      const orgQuery = query(
        collection(db, "organizations"),
        where("domain", "==", domain)
      );

      const orgSnap = await getDocs(orgQuery);

      if (!orgSnap.empty) {
        // ----- ORG EXISTS -----
        const orgDoc = orgSnap.docs[0];
        const orgId = orgDoc.id;
        const orgData = orgDoc.data() as any;
        const orgRef = doc(db, "organizations", orgId);

        const members = orgData.members || {};
        const alreadyMember = !!members[user.uid];

        if (!alreadyMember) {
          // If domain exists and login user is standard user → add them
          if (userRole === "user") {
            await updateDoc(orgRef, {
              [`members.${user.uid}`]: {
                email: user.email,
                role: "user",
                status: "active",
              },
            });
          } else if (userRole === "admin") {
            // Optional: ensure admin is recorded as admin member
            await updateDoc(orgRef, {
              [`members.${user.uid}`]: {
                email: user.email,
                role: "admin",
                status: "active",
              },
            });
          }
        }
      } else {
        // ----- ORG DOES NOT EXIST -----
        if (userRole === "admin") {
          // Admin is the first user from this domain → create org
          const orgRef = doc(collection(db, "organizations"));
          await setDoc(orgRef, {
            domain,
            organizationKey, // e.g. "acme" derived from "@acme" at signup
            createdAt: serverTimestamp(),
            createdBy: user.email,
            members: {
              [user.uid]: {
                email: user.email,
                role: "admin",
                status: "active",
              },
            },
          });
        } else {
          // Standard user, but no org for their domain
          setFormError(
            "No organization is registered for this email domain. Please contact your administrator."
          );
          await logout();
          setIsLoading(false);
          return;
        }
      }

      // 5. Redirect user
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Something went wrong while logging in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      // Handle organization membership for Google users
      const domain = user.email?.split("@")[1].toLowerCase();
      if (domain) {
        const orgQuery = query(
          collection(db, "organizations"),
          where("domain", "==", domain)
        );
        const orgSnap = await getDocs(orgQuery);

        if (!orgSnap.empty) {
          const orgDoc = orgSnap.docs[0];
          const orgId = orgDoc.id;
          const orgData = orgDoc.data();
          const orgRef = doc(db, "organizations", orgId);

          const alreadyMember = orgData.members && orgData.members[user.uid];
          if (!alreadyMember) {
            await updateDoc(orgRef, {
              [`members.${user.uid}`]: {
                email: user.email,
                role: "user",
                status: "active",
              }
            });
          }
        }
      }

      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show error
        return;
      }
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGithub();
      const user = result.user;

      // Handle organization membership for GitHub users
      const domain = user.email?.split("@")[1].toLowerCase();
      if (domain) {
        const orgQuery = query(
          collection(db, "organizations"),
          where("domain", "==", domain)
        );
        const orgSnap = await getDocs(orgQuery);

        if (!orgSnap.empty) {
          const orgDoc = orgSnap.docs[0];
          const orgId = orgDoc.id;
          const orgData = orgDoc.data();
          const orgRef = doc(db, "organizations", orgId);

          const alreadyMember = orgData.members && orgData.members[user.uid];
          if (!alreadyMember) {
            await updateDoc(orgRef, {
              [`members.${user.uid}`]: {
                email: user.email,
                role: "user",
                status: "active",
              }
            });
          }
        }
      }

      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show error
        return;
      }
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <Layout showNavbar={false}>
      <div className="login-page-v2 min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8fafc] dark:bg-neutral-950">
        {/* Background Gradients - Centered cluster */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/30 rounded-full blur-[80px] animate-pulse delay-1000"></div>

        {/* Back to Home Button */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-50">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors font-medium group text-sm sm:text-base relative"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Home</span>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-50">
          <ThemeToggle />
        </div>

        {/* Login Container (Centered) */}
        <div className="relative z-10 w-full max-w-[580px] px-4 sm:px-6 flex flex-col items-center py-6 sm:py-10">
          {/* Header Outside Card - Increased Size */}
          <div className="flex items-center space-x-3 mb-6 sm:mb-8">
            <img src={fixieLogo} alt="Fixie Logo" className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] object-contain" />
            <span className="font-bold text-2xl sm:text-4xl text-neutral-900 dark:text-white tracking-tight">
              Fixie
            </span>
          </div>

          <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-[20px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none p-5 sm:p-10">
            {/* Error Display */}
            {(error || formError) && (
              <div className="error-message mb-6 animate-shake text-xs sm:text-sm">{formError || error?.message}</div>
            )}

            {/* Social Logins First (Modern style) */}
            <div className="social-login gap-3 mb-6">
              <button
                className="social-btn google dark:bg-neutral-800 dark:border-neutral-700 dark:text-white hover:dark:bg-neutral-700 transition-all active:scale-95 text-xs sm:text-sm py-2.5 sm:py-3"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="google-icon w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                className="social-btn github dark:bg-neutral-800 dark:border-neutral-700 dark:text-white hover:dark:bg-neutral-700 transition-all active:scale-95 text-xs sm:text-sm py-2.5 sm:py-3"
                onClick={handleGithubLogin}
                disabled={isLoading}
              >
                <svg className="github-icon w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-sm font-medium uppercase tracking-wider">
                <span className="px-4 bg-white dark:bg-[#1f1f1f] text-neutral-400">or continue with email</span>
              </div>
            </div>

            {/* Login Form */}
            <form className="login-form space-y-4" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">Email address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@company.com"
                  required
                  disabled={isLoading}
                  className="mt-1.5 block w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center ml-1">
                  <label htmlFor="password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Password</label>
                  <a href="#forgot-password" className="text-[10px] sm:text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="mt-1.5 block w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center ml-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-3.5 h-3.5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                  />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Remember for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : "Log in to your account"}
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-6 text-center pt-4 border-t border-neutral-100 dark:border-neutral-700">
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                Don't have an account yet?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
                >
                  Create one now
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Login;
