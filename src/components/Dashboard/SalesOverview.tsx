"use client";

import { useState } from "react";
import { Package, Truck } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReportPeriodKey, SalesChart, SalesChartRange, SalesReport } from "@/lib/backend-types";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/order-status";
import { useApiQuery } from "./api";
import { formatBDT } from "./format";
import { StatusPill, selectClass } from "./ui";

const RANGES: { value: SalesChartRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "30d", label: "30 days" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
];

const axisLabel = (label: string, groupBy: "day" | "month") =>
  groupBy === "day"
    ? new Date(`${label}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : new Date(`${label}-01T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Sales split (company vs delivery company), orders by status and the sales chart (GET /reports/sales, /reports/sales/chart). */
export default function SalesOverview() {
  const report = useApiQuery<SalesReport>("/reports/sales");
  const [periodKey, setPeriodKey] = useState<ReportPeriodKey>("today");
  const [range, setRange] = useState<SalesChartRange>("7d");
  const chart = useApiQuery<SalesChart>(`/reports/sales/chart?range=${range}`);

  const data = report.data;
  const period = data?.periods.find((p) => p.key === periodKey) ?? data?.periods[0];
  const card = "rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs";

  // Only the product price (after discount) is the company's income; the shipping charge is handed to the shipping company.
  const splitCards = [
    {
      title: "Product sales",
      note: "Your income",
      value: period ? period.productSales - period.discount : null,
      sub:
        period && period.discount > 0
          ? `Products ${formatBDT(period.productSales)} − discount ${formatBDT(period.discount)}`
          : period
            ? `Product price of ${plural(period.orders, "delivered order")}`
            : "",
      icon: Package,
      tone: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-200",
    },
    {
      title: "Shipping charges",
      note: "Give to the shipping company",
      value: period?.shippingCost ?? null,
      sub: "Not your income",
      icon: Truck,
      tone: "bg-amber-50 text-amber-600",
      border: "border-amber-200",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className={`${card} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold tracking-wide text-slate-700 uppercase">Sales</h2>
            <p className="text-xs text-slate-500">Delivered orders, refunds excluded. Product price and shipping are shown separately.</p>
          </div>
          <select className={selectClass} value={periodKey} onChange={(e) => setPeriodKey(e.target.value as ReportPeriodKey)} disabled={!data}>
            {(data?.periods ?? []).map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {report.error ? (
          <p className="text-sm font-semibold text-rose-600">{report.error}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {splitCards.map(({ title, note, value, sub, icon: Icon, tone, border }) => (
              <div key={title} className={`rounded-2xl border ${border} p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">{title}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{note}</p>
                  </div>
                  <span className={`rounded-xl p-2 ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-3xl font-black text-slate-900">{value == null ? "…" : formatBDT(value)}</p>
                <p className="text-[11px] text-slate-400">{sub}</p>
              </div>
            ))}
          </div>
        )}
        {period && <p className="text-[11px] text-slate-400">Customers paid {formatBDT(period.amount)} in total (product price + shipping).</p>}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className={`${card} flex flex-col gap-3`}>
          <h2 className="text-sm font-extrabold tracking-wide text-slate-700 uppercase">Orders by status (now)</h2>
          <ul className="space-y-1.5">
            {ORDER_STATUSES.map((st) => {
              const row = data?.ordersByStatus[st];
              return (
                <li key={st} className="flex items-center justify-between gap-2 text-xs">
                  <span title={ORDER_STATUS_LABELS[st]}>
                    <StatusPill value={st} />
                  </span>
                  <span className="text-right font-semibold text-slate-600">
                    {row ? (
                      <>
                        {row.orders} · {formatBDT(row.productAmount)}
                        {row.shippingCost > 0 && <span className="block text-[10px] font-medium text-amber-600">+ {formatBDT(row.shippingCost)} shipping</span>}
                      </>
                    ) : (
                      "…"
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${card} flex flex-col gap-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold tracking-wide text-slate-700 uppercase">Sales chart</h2>
              {chart.data && (
                <p className="text-xs text-slate-500">
                  <span className="font-bold text-emerald-700">{formatBDT(chart.data.total.productAmount)} product sales</span> ·{" "}
                  <span className="font-bold text-amber-600">{formatBDT(chart.data.total.shippingCost)} shipping</span> · {plural(chart.data.total.orders, "order")}
                </p>
              )}
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 ${range === r.value ? "bg-white text-blue-700 shadow" : "text-slate-500"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            {chart.error ? (
              <p className="text-sm font-semibold text-rose-600">{chart.error}</p>
            ) : !chart.data ? (
              <div className="h-full animate-pulse rounded-2xl bg-slate-100" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="shippingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickFormatter={(l: string) => axisLabel(l, chart.data!.groupBy)}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={16}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `৳${v.toLocaleString("en-US")}`} />
                  <Tooltip
                    labelFormatter={(l) => axisLabel(String(l), chart.data!.groupBy)}
                    formatter={(v, name) => [formatBDT(Number(v)), name === "productAmount" ? "Product sales" : "Shipping"]}
                  />
                  <Area type="monotone" dataKey="productAmount" stroke="#059669" strokeWidth={2} fill="url(#salesFill)" />
                  <Area type="monotone" dataKey="shippingCost" stroke="#d97706" strokeWidth={2} fill="url(#shippingFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
