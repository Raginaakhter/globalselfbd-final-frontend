"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function Newsletter() {
  const { accessToken } = useAuth();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        // A logged-in customer's subscription is linked to their account
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ email, source: "home" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setDone(true);
        setEmail("");
      } else {
        toast.error(data.message || "Could not subscribe. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="get-notified" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-24">
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 text-white p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Get the best deals first</h2>
          <p className="text-sm text-white/85 mt-1.5">Join our list for weekly offers and new-arrival alerts. অফারের খবর সবার আগে পান।</p>
        </div>
        {done ? (
          <p className="flex items-center gap-2 font-bold bg-white/15 px-5 py-3 rounded-full">
            <CheckCircle2 className="w-5 h-5" /> Thanks — you&apos;re on the list!
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex w-full lg:w-auto lg:min-w-[420px] items-center rounded-full bg-white p-1.5 shadow-lg">
            <Mail className="w-5 h-5 ml-3 text-slate-400 shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="flex-1 min-w-0 px-3 py-2 text-sm text-slate-900 outline-none bg-transparent placeholder:text-slate-400"
            />
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-full bg-navy-700 hover:bg-navy-600 text-white text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
              Subscribe <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
