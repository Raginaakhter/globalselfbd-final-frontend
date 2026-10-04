"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Phone, ArrowLeft, Loader2, Globe, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNumber.replace(/[\s-]/g, "");
    if (!cleaned) return;

    setLoading(true);
    const success = await forgotPassword(cleaned);
    setLoading(false);

    if (success) {
      router.push(`/verify-otp?phone=${encodeURIComponent(cleaned)}`);
    }
  };

  return (
    <main className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white rounded-[15px] flex items-center justify-center">
                <Globe className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Global Shelf <span className="text-cyan-600">BD</span>
            </span>
          </Link>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-cyan-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your registered phone number and we&apos;ll send you a 6-digit verification code by SMS.
          </p>
        </div>

        {/* Card */}
        <div className="auth-card auth-card-hover rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01712345678"
                  className="auth-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <span>Send Verification Code</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
