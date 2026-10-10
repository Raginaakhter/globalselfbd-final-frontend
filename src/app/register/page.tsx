"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User as UserIcon,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Globe,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

// Phone registration disabled temporarily - email OTP only
// const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "identifier" | "otp";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const { requestOtp, verifyLoginOtp } = useAuth();

  const [step, setStep] = useState<Step>("identifier");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  // The identifier the backend actually received, so OTP step keeps using it even if the user edits the field.
  const [sentTo, setSentTo] = useState("");
  const [sentChannel, setSentChannel] = useState<"sms" | "email" | string>("email");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  // Development only: filled in from `data.devOnly.otp` in the request-otp response so devs don't need SMS access.
  const [devOtp, setDevOtp] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const normalizedIdentifier = (raw: string) => {
    const trimmed = raw.trim();
    // Phone support commented out:
    // if (trimmed.includes("@")) return trimmed.toLowerCase();
    // return trimmed.replace(/[\s-]/g, "");
    return trimmed.toLowerCase();
  };

  const identifierIsValid = (raw: string) => {
    const value = normalizedIdentifier(raw);
    // Phone support commented out:
    // return EMAIL.test(value) || BD_PHONE.test(value);
    return EMAIL.test(value);
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (name.trim().length > 100) {
      setErrorMsg("Full Name must be 100 characters or fewer.");
      return;
    }
    const value = normalizedIdentifier(identifier);
    if (!identifierIsValid(value)) {
      setErrorMsg("Enter a valid email address.");
      // Phone error message commented out:
      // setErrorMsg("Enter a valid email or Bangladeshi mobile number (e.g. 01712345678).");
      return;
    }

    setLoading(true);
    const result = await requestOtp(value);
    setLoading(false);

    if (result) {
      setSentTo(value);
      setSentChannel(result.channel || "email");
      // setSentChannel(result.channel || (value.includes("@") ? "email" : "sms"));
      setCooldown(result.resendAfterSeconds ?? 60);
      setDevOtp(result.devOtp ?? "");
      setStep("otp");
      setOtp(result.devOtp && /^\d{6}$/.test(result.devOtp) ? result.devOtp.split("") : ["", "", "", "", "", ""]);
      queueMicrotask(() => inputRefs[0].current?.focus());
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasted)) return;
    setOtp(pasted.split(""));
    inputRefs[5].current?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6 || !sentTo) return;

    setLoading(true);
    const success = await verifyLoginOtp(sentTo, code, name.trim() || undefined);
    setLoading(false);

    if (success) {
      const target = redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/";
      router.push(target);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !sentTo) return;
    setResendLoading(true);
    const result = await requestOtp(sentTo);
    setResendLoading(false);
    if (result) {
      setCooldown(result.resendAfterSeconds ?? 60);
      setDevOtp(result.devOtp ?? "");
      setOtp(result.devOtp && /^\d{6}$/.test(result.devOtp) ? result.devOtp.split("") : ["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
    }
  };

  // const channelLabel = sentChannel === "email" ? "email" : "SMS";
  // const IdentifierIcon = identifier.includes("@") ? Mail : Phone;

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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {step === "identifier" ? "Create your account" : "Enter verification code"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {step === "identifier"
            ? "Sign up with your email — we'll send a 6-digit verification code."
            /* Phone register text commented out:
            ? "Sign up with just your phone or email — we'll send a 6-digit code."
            */
            : <>We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{sentTo}</span></>}
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="auth-card auth-card-hover rounded-3xl p-8 shadow-xl">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === "identifier" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            {/* Full Name (optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Name <span className="font-medium text-slate-400 normal-case">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="auth-input"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
                {/* Phone or Email */}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                  {/* <IdentifierIcon className="w-5 h-5" /> */}
                </div>
                <input
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  /* placeholder="01712345678 or you@example.com" */
                  className="auth-input"
                />
              </div>
              <p className="text-[11px] mt-1.5 text-slate-500">
                We&apos;ll send a 6-digit code to this email. No password required.
                {/* We&apos;ll send a 6-digit code to this {identifier.includes("@") ? "email" : "phone"}. No password required. */}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 mt-2 rounded-xl font-bold text-sm btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Send verification code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            {devOtp && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <div className="font-bold uppercase tracking-wider">Dev-only preview</div>
                <div className="mt-1">
                  Backend returned OTP <span className="font-mono text-sm font-black tracking-widest">{devOtp}</span> (production hides this).
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center mb-3">
                6-Digit Verification Code
              </label>
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
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
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify &amp; create account</span>
              )}
            </button>

            <div className="text-center text-xs text-slate-500">
              Didn&apos;t receive the code?{" "}
              {cooldown > 0 ? (
                <span className="font-semibold text-slate-700">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="font-bold text-cyan-600 hover:text-cyan-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {resendLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Resend code</span>
                </button>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep("identifier");
                  setOtp(["", "", "", "", "", ""]);
                  setErrorMsg("");
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Use a different email</span>
                {/* <span>Use a different {sentChannel === "email" ? "email" : "phone"}</span> */}
              </button>
            </div>
          </form>
        )}

        {/* Footer Redirect */}
        <div className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href={redirectPath !== "/" ? `/login?redirect=${redirectPath}` : "/login"}
            className="font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col justify-center items-center p-4 sm:p-8 py-12">
      <Suspense fallback={<div className="text-slate-500 font-semibold">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
