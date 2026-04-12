import React, { useState } from "react";
import Layout from "../Layout";
import { useNavigate } from "react-router-dom";
import fixieLogo from "../../images/image.png";
import ThemeToggle from "../../components/layout/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";

function ForgotPassword() {
    const navigate = useNavigate();
    const { sendPasswordReset } = useAuth();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [canResend, setCanResend] = useState(true);
    const [countdown, setCountdown] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            await sendPasswordReset(email);
            setSuccessMessage(
                `Password reset email sent to ${email}. Please check your inbox and spam folder.`
            );

            // Start countdown for rate limiting
            setCanResend(false);
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            // For security, don't reveal if email exists or not
            setSuccessMessage(
                `If an account exists with ${email}, you will receive a password reset email shortly.`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate("/login");
    };

    return (
        <Layout showNavbar={false}>
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8fafc] dark:bg-neutral-950">
                {/* Background Gradients - Centered cluster */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/30 rounded-full blur-[80px] animate-pulse delay-1000"></div>

                {/* Back to Login Button */}
                <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-50">
                    <button
                        onClick={handleBackToLogin}
                        className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors font-medium group text-sm sm:text-base relative"
                    >
                        <svg
                            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Back to Login</span>
                    </button>
                </div>

                {/* Theme Toggle Button */}
                <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-50">
                    <ThemeToggle />
                </div>

                {/* Forgot Password Container */}
                <div className="relative z-10 w-full max-w-[580px] px-4 sm:px-6 flex flex-col items-center py-6 sm:py-10">
                    {/* Header Outside Card */}
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
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h2 className="text-xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">
                                Forgot Password?
                            </h2>
                            <p className="text-xs sm:text-base text-neutral-500 dark:text-neutral-400 font-medium">
                                No worries, we'll send you reset instructions
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
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-green-600 dark:text-green-400 text-sm sm:text-base font-medium mb-4">
                                    {successMessage}
                                </p>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleBackToLogin}
                                        className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transform transition-all active:scale-[0.98] text-sm sm:text-base"
                                    >
                                        Back to Login
                                    </button>
                                    {!canResend && countdown > 0 && (
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            Resend available in {countdown} seconds
                                        </p>
                                    )}
                                    {canResend && (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            className="w-full py-2.5 px-6 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                                        >
                                            Resend Email
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        {!successMessage && (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-1">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="name@company.com"
                                        required
                                        disabled={isLoading}
                                        className="mt-1.5 block w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
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
                                            Sending...
                                        </div>
                                    ) : "Send Reset Instructions"}
                                </button>
                            </form>
                        )}

                        {/* Back to Login Link */}
                        {!successMessage && (
                            <div className="mt-6 text-center pt-4 border-t border-neutral-100 dark:border-neutral-700">
                                <button
                                    onClick={handleBackToLogin}
                                    className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-indigo-500 dark:hover:text-indigo-400 font-medium transition-colors inline-flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default ForgotPassword;
