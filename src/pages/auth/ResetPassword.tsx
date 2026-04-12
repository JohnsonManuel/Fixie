import React, { useState, useEffect } from "react";
import Layout from "../Layout";
import { useNavigate, useSearchParams } from "react-router-dom";
import fixieLogo from "../../images/image.png";
import ThemeToggle from "../../components/layout/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { confirmPasswordReset, verifyPasswordResetCode } = useAuth();

    const [oobCode, setOobCode] = useState<string | null>(null);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [error, setError] = useState("");
    const [codeError, setCodeError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const code = searchParams.get("oobCode");

        if (!code) {
            setCodeError("Invalid or missing reset code. Please request a new password reset link.");
            setIsVerifying(false);
            return;
        }

        setOobCode(code);

        // Verify the code and get the email
        const verifyCode = async () => {
            try {
                const userEmail = await verifyPasswordResetCode(code);
                setEmail(userEmail);
                setIsVerifying(false);
            } catch (err: any) {
                if (err.code === "auth/invalid-action-code") {
                    setCodeError("This reset link has expired or has already been used. Please request a new one.");
                } else if (err.code === "auth/expired-action-code") {
                    setCodeError("This reset link has expired. Please request a new password reset.");
                } else {
                    setCodeError("Invalid reset link. Please request a new password reset.");
                }
                setIsVerifying(false);
            }
        };

        verifyCode();
    }, [searchParams, verifyPasswordResetCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!oobCode) {
            setError("Invalid reset code");
            return;
        }

        setIsLoading(true);

        try {
            await confirmPasswordReset(oobCode, password);
            setSuccessMessage("Password reset successful! Redirecting to login...");

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate("/login", { state: { message: "Password updated successfully. Please log in with your new password." } });
            }, 2000);
        } catch (err: any) {
            if (err.code === "auth/weak-password") {
                setError("Password is too weak. Please use a stronger password.");
            } else if (err.code === "auth/invalid-action-code") {
                setError("This reset link has expired or has already been used.");
            } else {
                setError("Failed to reset password. Please try again.");
            }
            setIsLoading(false);
        }
    };

    const handleRequestNewLink = () => {
        navigate("/forgot-password");
    };

    if (isVerifying) {
        return (
            <Layout showNavbar={false}>
                <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-neutral-950">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                        <p className="text-neutral-600 dark:text-neutral-400">Verifying reset link...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (codeError) {
        return (
            <Layout showNavbar={false}>
                <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8fafc] dark:bg-neutral-950">
                    {/* Background Gradients */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse delay-700"></div>

                    <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-50">
                        <ThemeToggle />
                    </div>

                    <div className="relative z-10 w-full max-w-[580px] px-4 sm:px-6">
                        <div className="flex items-center justify-center space-x-3 mb-6 sm:mb-8">
                            <img src={fixieLogo} alt="Fixie Logo" className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] object-contain" />
                            <span className="font-bold text-2xl sm:text-4xl text-neutral-900 dark:text-white tracking-tight">Fixie</span>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-[20px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none p-5 sm:p-10 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                                Invalid Reset Link
                            </h2>
                            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6">
                                {codeError}
                            </p>
                            <button
                                onClick={handleRequestNewLink}
                                className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transform transition-all active:scale-[0.98] text-base"
                            >
                                Request New Reset Link
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showNavbar={false}>
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8fafc] dark:bg-neutral-950">
                {/* Background Gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/30 rounded-full blur-[80px] animate-pulse delay-1000"></div>

                {/* Theme Toggle */}
                <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-50">
                    <ThemeToggle />
                </div>

                {/* Reset Password Container */}
                <div className="relative z-10 w-full max-w-[580px] px-4 sm:px-6 flex flex-col items-center py-6 sm:py-10">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                        <img src={fixieLogo} alt="Fixie Logo" className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] object-contain" />
                        <span className="font-bold text-2xl sm:text-4xl text-neutral-900 dark:text-white tracking-tight">
                            Fixie
                        </span>
                    </div>

                    <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-[20px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none p-5 sm:p-10">
                        {/* Header */}
                        <div className="mb-6 sm:mb-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">
                                Set New Password
                            </h2>
                            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                For {email}
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mb-6 animate-shake text-center p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl sm:rounded-2xl border border-red-100 dark:border-red-900/30 text-xs sm:text-sm font-semibold">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className="mb-6 text-center p-5 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-xl sm:rounded-2xl border border-green-100 dark:border-green-900/30">
                                <div className="flex items-center justify-center mb-3">
                                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-green-600 dark:text-green-400 text-sm sm:text-base font-medium">
                                    {successMessage}
                                </p>
                            </div>
                        )}

                        {/* Form */}
                        {!successMessage && (
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                                        New Password
                                    </label>
                                    <div className="relative mt-1.5">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setError("");
                                            }}
                                            placeholder="••••••••"
                                            required
                                            disabled={isLoading}
                                            className="block w-full px-4 py-3 pr-11 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-1.5 ml-1 text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                                        Must be at least 6 characters
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                                        Confirm New Password
                                    </label>
                                    <div className="relative mt-1.5">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                setError("");
                                            }}
                                            placeholder="••••••••"
                                            required
                                            disabled={isLoading}
                                            className="block w-full px-4 py-3 pr-11 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 text-base mt-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Resetting Password...
                                        </div>
                                    ) : "Reset Password"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default ResetPassword;
