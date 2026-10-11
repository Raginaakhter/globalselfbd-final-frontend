"use client";

import { AlertTriangle, Banknote, Boxes, CheckCircle2, Clock, PackageCheck, PackageX, Scale, Truck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CourierSummary } from "@/lib/backend-types";
import { useApiQuery } from "../../api";
import { formatBDT } from "../../format";
import { ErrorBox, PageHeader, Spinner } from "../../ui";

interface Card {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
  hint?: string;
}

export default function CourierOverviewPage() {
  const summary = useApiQuery<CourierSummary>("/admin/courier/summary");

  if (summary.loading && !summary.data) return <Spinner label="Loading courier summary..." />;
  if (summary.error) return <ErrorBox message={summary.error} onRetry={summary.reload} />;
  if (!summary.data) return null;

  const d = summary.data;

  const booking: Card[] = [
    { key: "total", label: "Total shipments", value: d.totalShipments.toLocaleString(), icon: Truck, tone: "bg-blue-50 text-blue-700" },
    { key: "success", label: "Booked successfully", value: d.booking.success.toLocaleString(), icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { key: "failed", label: "Booking failed", value: d.booking.failed.toLocaleString(), icon: PackageX, tone: "bg-rose-50 text-rose-700", hint: "Needs admin retry" },
    { key: "uncertain", label: "Uncertain — verify", value: d.booking.uncertain.toLocaleString(), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700", hint: "Check Steadfast portal" },
  ];

  const delivery: Card[] = [
    { key: "delivered", label: "Delivered (confirmed)", value: d.delivery.delivered.toLocaleString(), icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700" },
    { key: "partial", label: "Partial delivered", value: d.delivery.partial_delivered.toLocaleString(), icon: PackageCheck, tone: "bg-teal-50 text-teal-700" },
    { key: "cancelled", label: "Cancelled", value: d.delivery.cancelled.toLocaleString(), icon: PackageX, tone: "bg-rose-50 text-rose-700" },
    { key: "review", label: "In review", value: d.delivery.in_review.toLocaleString(), icon: Clock, tone: "bg-sky-50 text-sky-700" },
    { key: "hold", label: "On hold", value: d.delivery.hold.toLocaleString(), icon: Clock, tone: "bg-amber-50 text-amber-700" },
    { key: "pending", label: "Pending", value: d.delivery.pending.toLocaleString(), icon: Clock, tone: "bg-slate-100 text-slate-700" },
  ];

  const approvalPending: Card[] = [
    { key: "deliv-ap", label: "Delivered · pending approval", value: d.delivery.delivered_approval_pending.toLocaleString(), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    { key: "partial-ap", label: "Partial · pending approval", value: d.delivery.partial_delivered_approval_pending.toLocaleString(), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    { key: "cancel-ap", label: "Cancelled · pending approval", value: d.delivery.cancelled_approval_pending.toLocaleString(), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    { key: "unknown-ap", label: "Unknown · pending approval", value: d.delivery.unknown_approval_pending.toLocaleString(), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
  ];

  const financials: Card[] = [
    { key: "cod-sub", label: "COD submitted", value: formatBDT(d.totals.codSubmitted), icon: Banknote, tone: "bg-sky-50 text-sky-700" },
    { key: "cod-recv", label: "COD received", value: formatBDT(d.totals.codReceived), icon: Banknote, tone: "bg-emerald-50 text-emerald-700" },
    { key: "cod-out", label: "COD outstanding", value: formatBDT(d.totals.codOutstanding), icon: Scale, tone: "bg-amber-50 text-amber-700" },
    { key: "charge-cfg", label: "Configured charges", value: formatBDT(d.totals.configuredCharge), icon: Wallet, tone: "bg-slate-100 text-slate-700" },
    { key: "charge-act", label: "Actual charges (verified)", value: formatBDT(d.totals.actualCharge), icon: Wallet, tone: "bg-indigo-50 text-indigo-700" },
    { key: "balance", label: "Courier account balance", value: d.courierBalance == null ? "—" : formatBDT(d.courierBalance), icon: Boxes, tone: "bg-blue-50 text-blue-700" },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Steadfast Courier Overview" subtitle="Live totals from your Steadfast shipments, delivery statuses, and COD settlement." />

      {!d.configured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-extrabold">Steadfast integration is not configured.</p>
            <p className="mt-0.5 text-amber-700">
              Set <code className="rounded bg-white/70 px-1 py-0.5 font-mono">STEADFAST_API_KEY</code> and{" "}
              <code className="rounded bg-white/70 px-1 py-0.5 font-mono">STEADFAST_SECRET_KEY</code> on the backend. Admins cannot book parcels until this is done.
            </p>
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-3 px-1 text-xs font-extrabold tracking-wider text-slate-500 uppercase">Booking</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {booking.map((c) => <StatCard key={c.key} card={c} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 text-xs font-extrabold tracking-wider text-slate-500 uppercase">Delivery</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {delivery.map((c) => <StatCard key={c.key} card={c} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 text-xs font-extrabold tracking-wider text-slate-500 uppercase">
          Approval-pending (verify before trusting)
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {approvalPending.map((c) => <StatCard key={c.key} card={c} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 text-xs font-extrabold tracking-wider text-slate-500 uppercase">Finance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {financials.map((c) => <StatCard key={c.key} card={c} />)}
        </div>
      </section>
    </div>
  );
}

function StatCard({ card }: { card: Card }) {
  const Icon = card.icon;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{card.label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-xl font-extrabold text-slate-900">{card.value}</div>
      {card.hint && <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{card.hint}</div>}
    </div>
  );
}
