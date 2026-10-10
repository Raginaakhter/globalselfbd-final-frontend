"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApiAction, useApiQuery } from "../api";
import { ErrorBox, FieldError, PageHeader, PrimaryButton, Spinner, inputClass, labelClass } from "../ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface NotificationSettings {
  adminEmail: string;
}

/** Admin notification email: the address Resend sends internal alerts to (e.g. stock-out). */
export default function NotificationSettingsPage() {
  const settings = useApiQuery<NotificationSettings>("/settings/notifications");
  if (settings.error) return <ErrorBox message={settings.error} onRetry={settings.reload} />;
  if (!settings.data) return <Spinner label="Loading notification email..." />;
  return <NotificationSettingsForm initial={settings.data} onSaved={settings.setData} />;
}

function NotificationSettingsForm({
  initial,
  onSaved,
}: {
  initial: NotificationSettings;
  onSaved: (s: NotificationSettings) => void;
}) {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const [email, setEmail] = useState(initial.adminEmail || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const readOnly = !hasPermission("settings.update");

  // Keep the field in sync when the parent reloads (e.g. after a save that returned fresh data).
  useEffect(() => {
    setEmail(initial.adminEmail || "");
  }, [initial.adminEmail]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (value !== "" && !EMAIL.test(value)) {
      return setError("Enter a valid email address, or leave empty to clear.");
    }
    setError("");
    setSaving(true);
    const res = await action<NotificationSettings>("/settings/notifications", {
      method: "PUT",
      json: { adminEmail: value },
    });
    setSaving(false);
    if (res) onSaved(res.data);
  };

  const clear = async () => {
    setError("");
    setSaving(true);
    const res = await action<NotificationSettings>("/settings/notifications", {
      method: "PUT",
      json: { adminEmail: "" },
    });
    setSaving(false);
    if (res) {
      onSaved(res.data);
      setEmail("");
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Notification Email"
        subtitle="Internal alerts (stock-out, etc.) are delivered to this address via Resend. This is separate from customer email."
      >
        {!readOnly && (
          <div className="flex items-center gap-2">
            {initial.adminEmail && (
              <button
                type="button"
                onClick={clear}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            )}
            <PrimaryButton type="submit" loading={saving}>
              Save Email
            </PrimaryButton>
          </div>
        )}
      </PageHeader>

      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Bell className="h-4 w-4 text-slate-400" /> Admin alerts
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Admin notification email</span>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              placeholder="ops@yourdomain.com"
              disabled={readOnly}
              className={`${inputClass} pl-10`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <span className="text-[11px] text-slate-400">
            Leave empty to disable admin alerts entirely. Customers are notified on their own verified contact; this only
            affects internal admin notifications.
          </span>
        </label>

        <FieldError message={error} />

        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          Currently: <span className="font-semibold text-slate-700">{initial.adminEmail || "(not set — admin alerts are off)"}</span>
        </div>
      </section>
    </form>
  );
}
