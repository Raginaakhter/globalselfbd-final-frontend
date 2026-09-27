"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Form = { name: string; email: string; phone: string; subject: string; message: string };
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = { name: "", email: "", phone: "", subject: "", message: "" };

function validate(f: Form): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email address.";
  if (f.subject.trim().length < 2) e.subject = "Please enter a subject.";
  if (f.message.trim().length < 10) e.message = "Please enter a message of at least 10 characters.";
  return e;
}

const inputCls = (err?: string) =>
  `w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
    err ? "border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-brand-600 focus:ring-brand-600/15"
  }`;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-xs text-rose-600 font-medium mt-1.5">{error}</span>}
    </label>
  );
}

export default function ContactForm() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        // A logged-in customer's message is linked to their account
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
        setForm(EMPTY);
        toast.success(data.message || "Message sent!");
      } else {
        toast.error(data.message || "Failed to send your message. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-3xl bg-brand-50 border border-brand-200 p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-brand-600 mx-auto mb-3" />
        <p className="font-bold text-navy-800">Thanks for reaching out!</p>
        <p className="text-sm text-slate-600 mt-1">Our team will get back to you as soon as possible.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-5 text-sm font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" error={errors.name}>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="Your full name" className={inputCls(errors.name)} />
        </Field>
        <Field label="Email Address" error={errors.email}>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="name@example.com" className={inputCls(errors.email)} />
        </Field>
        <Field label="Phone Number" error={errors.phone}>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX (optional)" className={inputCls(errors.phone)} />
        </Field>
        <Field label="Subject" error={errors.subject}>
          <input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="What's this about?" className={inputCls(errors.subject)} />
        </Field>
      </div>
      <Field label="Message" error={errors.message}>
        <textarea rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="How can we help?" className={inputCls(errors.message)} />
      </Field>
      <button
        type="submit"
        disabled={sending}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send Message
          </>
        )}
      </button>
    </form>
  );
}
