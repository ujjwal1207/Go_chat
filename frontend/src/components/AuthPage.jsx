import React, { useState } from "react";
import {
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../store/auth.js";
import { maskEmail, cn } from "../lib/utils.js";

export function AuthPage({ onSuccess }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    requestOTP,
    verifyOTP,
    setError,
    setLoading,
    error,
    clearError,
    isLoading,
  } = useAuthStore();

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    clearError();

    try {
      await requestOTP(email);
      setStep("otp");
      setResendTimer(60);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || isSubmitting) return;

    setIsSubmitting(true);
    clearError();

    try {
      const user = await verifyOTP(email, otp, email.split("@")[0]);
      onSuccess();
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;

    setIsSubmitting(true);
    clearError();

    try {
      await requestOTP(email);
      setResendTimer(60);
    } catch (err) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Welcome to RealChat
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              {step === "email"
                ? "Enter your email to get started"
                : "Check your email for the verification code"}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step === "email"
                      ? "bg-indigo-600 text-white"
                      : "bg-green-500 text-white"
                  )}
                >
                  {step === "email" ? "1" : <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Email
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400" />
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step === "otp"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  2
                </div>
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Verify
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="text-sm text-rose-700 dark:text-rose-400">
                {error}
              </span>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={!email || isSubmitting}
                className="w-full bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Email confirmation */}
              <div className="text-center mb-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  OTP sent to
                </p>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {maskEmail(email)}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Verification code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                    placeholder="000000"
                    maxLength={6}
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
                    Enter the 6-digit code (use 123456 for demo)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otp.length !== 6 || isSubmitting}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend OTP */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Resend code in {resendTimer}s
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Back to email */}
              <div className="text-center">
                <button
                  onClick={handleBackToEmail}
                  disabled={isSubmitting}
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Wrong email? Go back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
