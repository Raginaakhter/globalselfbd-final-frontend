"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, ArrowLeft, Loader2, Globe, RefreshCw } from "lucide-react";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") || "";

  const { verifyOtp, forgotPassword } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(phoneParam);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input box
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs[5].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");

    if (!phoneNumber) {
      alert("Phone number is missing. Please start from Forgot Password.");
      router.push("/forgot-password");
      return;
    }

    if (fullOtp.length !== 6) {
      return;
    }

    setLoading(true);
    const resetToken = await verifyOtp(phoneNumber, fullOtp);
    setLoading(false);

    if (resetToken) {
      sessionStorage.setItem("resetToken", resetToken);
      router.push(`/reset-password?token=${encodeURIComponent(resetToken)}`);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !phoneNumber) return;

    setResendLoading(true);
    const success = await forgotPassword(phoneNumber);
    setResendLoading(false);

    if (success) {
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
    }
  };

  return (
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
          <ShieldCheck className="w-6 h-6 text-cyan-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enter Verification Code</h1>
        <p className="text-sm text-slate-500 mt-1">
          We&apos;ve sent a 6-digit code to <span className="font-semibold text-slate-800">{phoneNumber || "your phone"}</span>
        </p>
      </div>

      {/* Main Form Card */}
      <div className="auth-card auth-card-hover rounded-3xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone input if missing */}
          {!phoneParam && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                required
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01712345678"
                className="auth-input pl-4"
              />
            </div>
          )}

          {/* 6 Digit OTP Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center mb-3">
              6-Digit Security Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black text-slate-900 bg-white border-2 border-slate-200 rounded-2xl focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all shadow-sm"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        {/* Resend Timer section */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Didn&apos;t receive the code?{" "}
          {cooldown > 0 ? (
            <span className="font-semibold text-slate-700">Resend code in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="font-bold text-cyan-600 hover:text-cyan-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              {resendLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>Resend Code</span>
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change phone number</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col justify-center items-center p-4 sm:p-8">
      <Suspense fallback={<div className="text-slate-500 font-semibold">Loading verification...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </main>
  );
}
