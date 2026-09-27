"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { ShippingSettings } from "@/lib/backend-types";
import { useApiAction, useApiQuery } from "../api";
import { formatBDT } from "../format";
import { ErrorBox, FieldError, PageHeader, PrimaryButton, Spinner, inputClass, labelClass } from "../ui";

const MAX_CHARGE = 10000;

/** Delivery charges used by checkout (GET/PUT /settings/shipping). New orders use changes right away. */
export default function ShippingPage() {
  const shipping = useApiQuery<ShippingSettings>("/settings/shipping");
  if (shipping.error) return <ErrorBox message={shipping.error} onRetry={shipping.reload} />;
  if (!shipping.data) return <Spinner label="Loading delivery charges..." />;
  return <ShippingForm initial={shipping.data} onSaved={shipping.setData} />;
}

function ShippingForm({ initial, onSaved }: { initial: ShippingSettings; onSaved: (s: ShippingSettings) => void }) {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const [form, setForm] = useState({ insideDhaka: String(initial.insideDhaka), outsideDhaka: String(initial.outsideDhaka) });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const readOnly = !hasPermission("settings.update");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inside = Number(form.insideDhaka);
    const outside = Number(form.outsideDhaka);
    if ([inside, outside].some((n) => form.insideDhaka.trim() === "" || form.outsideDhaka.trim() === "" || !Number.isFinite(n) || n < 0 || n > MAX_CHARGE)) {
      return setError(`Charges must be between 0 and ${MAX_CHARGE} BDT.`);
    }
    setError("");
    setSaving(true);
    const res = await action<ShippingSettings>("/settings/shipping", { method: "PUT", json: { insideDhaka: inside, outsideDhaka: outside } });
    setSaving(false);
    if (res) onSaved(res.data);
  };

  const field = (key: keyof typeof form, label: string, hint: string) => (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-bold text-slate-400">৳</span>
        <input
          type="number"
          min={0}
          max={MAX_CHARGE}
          step="1"
          disabled={readOnly}
          className={`${inputClass} pl-8`}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      </div>
      <span className="text-[11px] text-slate-400">{hint}</span>
    </label>
  );

  return (
    <form onSubmit={submit} className="flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Delivery Charges" subtitle="Charged at checkout. New orders use changes right away; existing orders keep the charge they were placed with.">
        {!readOnly && (
          <PrimaryButton type="submit" loading={saving}>
            Save Charges
          </PrimaryButton>
        )}
      </PageHeader>

      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Truck className="h-4 w-4 text-slate-400" /> Charges
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("insideDhaka", "Inside Dhaka", `Currently ${formatBDT(initial.insideDhaka)}`)}
          {field("outsideDhaka", "Outside Dhaka", `Currently ${formatBDT(initial.outsideDhaka)}`)}
        </div>
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{initial.rule}</p>
        <FieldError message={error} />
      </section>
    </form>
  );
}
