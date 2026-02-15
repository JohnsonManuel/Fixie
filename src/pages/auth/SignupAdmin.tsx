import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

import { useNavigate } from "react-router-dom";
import Layout from "../Layout";
import fixieLogo from "../../images/image.png";
import ThemeToggle from "../../components/layout/ThemeToggle";

const SignupAdmin = () => {
  const navigate = useNavigate();
  const { signUpAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorFields, setErrorFields] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirm") setConfirm(value);

    if (error) setError("");
    if (errorFields.includes(field)) {
      setErrorFields(errorFields.filter((f) => f !== field));
    }
  };

  const validateForm = () => {
    const newErrorFields: string[] = [];
    if (password !== confirm) {
      setError("Passwords do not match");
      newErrorFields.push("confirm");
      setErrorFields(newErrorFields);
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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

    try {
      setLoading(true);
      setError("");
      setMessage("");
      setErrorFields([]);
      const user = await signUpAdmin(email, password);
      setMessage(
        `A verification email has been sent to ${user.email}. Please verify before continuing.`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavbar={false}>
      <div className="signup-page-v2 min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8fafc] dark:bg-neutral-950">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>

        {/* Back Button */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-50">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors font-medium group text-sm sm:text-base"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Home</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-50">
          <ThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-[500px] px-4 sm:px-6 flex flex-col items-center">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <img src={fixieLogo} alt="Fixie Logo" className="w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] object-contain" />
            <span className="font-bold text-3xl sm:text-4xl text-neutral-900 dark:text-white tracking-tight">Fixie</span>
          </div>

          <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-[24px] sm:rounded-[32px] shadow-xl p-6 sm:p-10">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 text-center">Tech Admin Sign-Up</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 text-sm font-semibold animate-shake">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl border border-green-100 dark:border-green-900/30 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all ${errorFields.includes("email") ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all ${errorFields.includes("password") ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => handleInputChange("confirm", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all ${errorFields.includes("confirm") ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                {loading ? "Creating..." : "Create Admin Account"}
              </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                Already an admin? <button onClick={() => navigate("/login")} className="text-indigo-500 font-bold hover:underline">Log in</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignupAdmin;
