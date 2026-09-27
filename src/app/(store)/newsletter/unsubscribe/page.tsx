"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, Loader2, MailX } from "lucide-react";

// Opened from the "Unsubscribe" link in newsletter emails: /newsletter/unsubscribe?token=...
// The customer confirms with a button, so email link scanners cannot unsubscribe them by accident.
function UnsubscribeCard() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const unsubscribe = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/v1/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(data.message ?? "");
      setState(res.ok && data.success ? "done" : "error");
    } catch {
      setMessage("Network error. Please try again.");
      setState("error");
    }
  };

  if (!token) {
    return (
      <Card icon={<CircleAlert className="h-12 w-12 text-amber-500" />} title="Invalid link">
        This unsubscribe link is incomplete. Please use the link from the bottom of our email.
      </Card>
    );
  }

  // Test emails and the admin preview use a placeholder token
  if (token === "test" || token === "preview") {
    return (
      <Card icon={<CircleAlert className="h-12 w-12 text-sky-500" />} title="This is a test email">
        The unsubscribe link only works in real newsletter emails sent to subscribers.
      </Card>
    );
  }

  if (state === "done") {
    return (
      <Card icon={<CheckCircle2 className="h-12 w-12 text-emerald-600" />} title="You are unsubscribed">
        {message || "You will not get our newsletter any more."} Changed your mind? Subscribe again at the bottom of our home page.
      </Card>
    );
  }

  return (
    <Card icon={<MailX className="h-12 w-12 text-slate-400" />} title="Unsubscribe from our newsletter?">
      You will stop getting offers and new product emails from Global Shelf BD. Order emails are not affected.
      {state === "error" && <span className="mt-3 block font-semibold text-rose-600">{message || "Could not unsubscribe. Please try again."}</span>}
      <button
        onClick={unsubscribe}
        disabled={state === "loading"}
        className="mx-auto mt-6 flex cursor-pointer items-center gap-2 rounded-full bg-navy-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-navy-600 disabled:opacity-60"
      >
        {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        Yes, unsubscribe me
      </button>
    </Card>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-lg">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h1 className="text-xl font-black text-navy-700">{title}</h1>
      <div className="mt-2 text-sm text-slate-500">{children}</div>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">
        Back to home
      </Link>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="px-4">
      <Suspense fallback={<div className="mt-16 text-center text-sm text-slate-400">Loading...</div>}>
        <UnsubscribeCard />
      </Suspense>
    </div>
  );
}
