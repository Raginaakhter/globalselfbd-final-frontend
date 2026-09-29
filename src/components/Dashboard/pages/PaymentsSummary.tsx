"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Hourglass, Wallet } from "lucide-react";
import { PAYMENT_METHOD_LABELS, type PaymentsReport, type ReportPeriodKey } from "@/lib/backend-types";
import { useApiQuery } from "../api";
import { formatBDT } from "../format";
import { selectClass } from "../ui";

/** Money received / refunded per period and what is still outstanding (GET /reports/payments). */
export default function PaymentsSummary() {
  const report = useApiQuery<PaymentsReport>("/reports/payments");
  const [periodKey, setPeriodKey] = useState<ReportPeriodKey>("last30Days");

  if (report.error) return <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Could not load the payments summary: {report.error}</p>;
  const data = report.data;
  const period = data?.periods.find((p) => p.key === periodKey) ?? data?.periods[0];

  const cards = [
    { title: "Received", value: period?.received.amount, split: period?.received, sub: period ? `${period.received.orders} paid order${period.received.orders === 1 ? "" : "s"}` : "", icon: ArrowDownLeft, tone: "bg-emerald-50 text-emerald-600" },
    { title: "Refunded", value: period?.refunded.amount, split: period?.refunded, sub: period ? `${period.refunded.orders} refunded` : "", icon: ArrowUpRight, tone: "bg-rose-50 text-rose-600" },
    { title: "Net", value: period?.net, split: period?.netSplit, sub: period?.label ?? "", icon: Wallet, tone: "bg-blue-50 text-blue-600" },
    { title: "Outstanding", value: data?.outstanding.amount, split: data?.outstanding, sub: data ? `${data.outstanding.orders} unpaid order${data.outstanding.orders === 1 ? "" : "s"} (all time)` : "", icon: Hourglass, tone: "bg-amber-50 text-amber-600" },
  ];

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold tracking-wide text-slate-700 uppercase">Payments summary</h2>
        <select className={selectClass} value={periodKey} onChange={(e) => setPeriodKey(e.target.value as ReportPeriodKey)} disabled={!data}>
          {(data?.periods ?? []).map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ title, value, split, sub, icon: Icon, tone }) => (
          <div key={title} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">{title}</span>
              <span className={`rounded-xl p-2 ${tone}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            {/* The big number is the product price (the company's money); shipping is handed to the shipping company */}
            <div className="mt-2 text-2xl font-black text-slate-900">{split ? formatBDT(split.productAmount) : "…"}</div>
            <div className="text-[11px] text-slate-400">Product price · {sub}</div>
            {split && title === "Refunded" && (
              // Refunds give back only the product price; the delivery charge stays with the shipping company
              <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">Product price only. Delivery charge is not refunded.</p>
            )}
            {split && title !== "Refunded" && (
              <dl className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Shipping (to shipping co.)</dt>
                  <dd className="font-bold text-amber-700">{formatBDT(split.shippingCost)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Total with shipping</dt>
                  <dd className="font-semibold text-slate-500">{value == null ? "…" : formatBDT(value)}</dd>
                </div>
              </dl>
            )}
          </div>
        ))}
      </div>
      {!!data?.outstanding.byPaymentMethod.length && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-500">Outstanding by method:</span>
          {data.outstanding.byPaymentMethod.map((m) => (
            <span key={m.paymentMethod} className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold">
              {PAYMENT_METHOD_LABELS[m.paymentMethod] ?? m.paymentMethod}: {formatBDT(m.amount)} ({m.orders})
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-400">Received counts orders on the day they were marked PAID. Times are {data?.timezone ?? "Bangladesh time"}.</p>
    </section>
  );
}
