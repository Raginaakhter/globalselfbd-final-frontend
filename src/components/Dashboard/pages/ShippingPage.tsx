"use client";

import { useState } from "react";
import { CalendarClock, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { PreOrderSettings, ShippingSettings } from "@/lib/backend-types";
import { useApiAction, useApiQuery } from "../api";
import { formatBDT } from "../format";
import { ErrorBox, FieldError, PageHeader, PrimaryButton, Spinner, Toggle, inputClass, labelClass } from "../ui";

const MAX_CHARGE = 10000;

/** Delivery charges used by checkout (GET/PUT /settings/shipping). New orders use changes right away. */
export default function ShippingPage() {
  const shipping = useApiQuery<ShippingSettings>("/settings/shipping");
  const preOrder = useApiQuery<PreOrderSettings>("/settings/preorder");
  if (shipping.error) return <ErrorBox message={shipping.error} onRetry={shipping.reload} />;
  if (!shipping.data) return <Spinner label="Loading delivery charges..." />;
  return (
    <div className="flex flex-col gap-8">
      <ShippingForm initial={shipping.data} onSaved={shipping.setData} />
      {preOrder.error ? (
        <ErrorBox message={preOrder.error} onRetry={preOrder.reload} />
      ) : !preOrder.data ? (
        <Spinner label="Loading pre-order settings..." />
      ) : (
        <PreOrderSettingsForm initial={preOrder.data} onSaved={preOrder.setData} />
      )}
    </div>
  );
}

function ShippingForm({ initial, onSaved }: { initial: ShippingSettings; onSaved: (s: ShippingSettings) => void }) {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const [form, setForm] = useState({
    insideDhaka: String(initial.insideDhaka),
    outsideDhaka: String(initial.outsideDhaka),
    deliveryChargesEnabled: initial.deliveryChargesEnabled,
  });
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
    const res = await action<ShippingSettings>("/settings/shipping", {
      method: "PUT",
      json: { insideDhaka: inside, outsideDhaka: outside, deliveryChargesEnabled: form.deliveryChargesEnabled },
    });
    setSaving(false);
    if (res) onSaved(res.data);
  };

  const chargeField = (key: "insideDhaka" | "outsideDhaka", label: string, hint: string) => (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-bold text-slate-400">৳</span>
        <input
          type="number"
          min={0}
          max={MAX_CHARGE}
          step="1"
          disabled={readOnly || !form.deliveryChargesEnabled}
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
        <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
          <span className="flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-800">Charge delivery on orders</span>
            <span className="text-[11px] font-medium text-slate-500">
              Site-wide kill switch. Turn off to run a &ldquo;free delivery everywhere&rdquo; promo — every order ships at 0, ignoring per-city rates and per-product flags.
            </span>
          </span>
          <Toggle
            checked={form.deliveryChargesEnabled}
            onChange={(v) => !readOnly && setForm((f) => ({ ...f, deliveryChargesEnabled: v }))}
          />
        </label>
        {!form.deliveryChargesEnabled && (
          <p className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
            Delivery charges are OFF site-wide. Every new order will ship free until you turn this back on.
          </p>
        )}

        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Truck className="h-4 w-4 text-slate-400" /> Charges
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {chargeField("insideDhaka", "Inside Dhaka", `Currently ${formatBDT(initial.insideDhaka)}`)}
          {chargeField("outsideDhaka", "Outside Dhaka", `Currently ${formatBDT(initial.outsideDhaka)}`)}
        </div>
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{initial.rule}</p>
        <FieldError message={error} />
      </section>
    </form>
  );
}

/** Pre-order defaults (GET/PUT /settings/preorder). Controls auto-flip on stock-out and default delivery window. */
function PreOrderSettingsForm({ initial, onSaved }: { initial: PreOrderSettings; onSaved: (s: PreOrderSettings) => void }) {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const [form, setForm] = useState({
    autoEnableOnStockOut: initial.autoEnableOnStockOut,
    defaultPreOrderDays: String(initial.defaultPreOrderDays),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const readOnly = !hasPermission("settings.update");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = Number(form.defaultPreOrderDays);
    if (!Number.isInteger(days) || days < initial.minDeliveryDays || days > initial.maxDeliveryDays) {
      return setError(`Default delivery days must be a whole number between ${initial.minDeliveryDays} and ${initial.maxDeliveryDays}.`);
    }
    setError("");
    setSaving(true);
    const res = await action<PreOrderSettings>("/settings/preorder", {
      method: "PUT",
      json: { autoEnableOnStockOut: form.autoEnableOnStockOut, defaultPreOrderDays: days },
    });
    setSaving(false);
    if (res) onSaved(res.data);
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Pre-Order Settings"
        subtitle="How products behave when stock runs out, and the default promised delivery window."
      >
        {!readOnly && (
          <PrimaryButton type="submit" loading={saving}>
            Save Pre-Order Settings
          </PrimaryButton>
        )}
      </PageHeader>

      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <CalendarClock className="h-4 w-4 text-slate-400" /> Behaviour
        </div>

        <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
          <span className="flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-800">Auto-enable pre-order when stock runs out</span>
            <span className="text-[11px] font-medium text-slate-500">
              When on, a product auto-flips to Pre-Order the moment its stock reaches 0 and reverts back when restocked. Products you toggled manually stay locked.
            </span>
          </span>
          <Toggle
            checked={form.autoEnableOnStockOut}
            onChange={(v) => !readOnly && setForm((f) => ({ ...f, autoEnableOnStockOut: v }))}
            color="peer-checked:bg-violet-600"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Default delivery window (days)</span>
          <input
            type="number"
            min={initial.minDeliveryDays}
            max={initial.maxDeliveryDays}
            step={1}
            disabled={readOnly}
            className={inputClass}
            value={form.defaultPreOrderDays}
            onChange={(e) => setForm((f) => ({ ...f, defaultPreOrderDays: e.target.value }))}
          />
          <span className="text-[11px] text-slate-400">
            Must be between {initial.minDeliveryDays} and {initial.maxDeliveryDays}. Applied when a product auto-enables pre-order.
          </span>
        </label>

        <FieldError message={error} />
      </section>
    </form>
  );
}
