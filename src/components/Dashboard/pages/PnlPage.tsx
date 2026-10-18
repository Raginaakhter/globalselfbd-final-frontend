"use client";

import { useState } from "react";
import { CalendarRange, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { ExpenseType, PnlCustomRangeReport, PnlPeriod, PnlPeriodTotals, PnlReport, PnlRollingReport } from "@/lib/backend-types";
import { EXPENSE_TYPE_LABELS, isPnlRolling } from "@/lib/backend-types";
import { qs, useApiQuery } from "../api";
import { formatBDT } from "../format";
import { ErrorBox, PageHeader, PrimaryButton, Spinner, inputClass, labelClass } from "../ui";

type Mode = "rolling" | "custom";

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function PnlPage() {
  const [mode, setMode] = useState<Mode>("rolling");
  const [fromDate, setFromDate] = useState(daysAgoIso(30));
  const [toDate, setToDate] = useState(todayIso());
  const [customApplied, setCustomApplied] = useState(false);

  const pnl = useApiQuery<PnlReport>(
    mode === "rolling"
      ? "/reports/pnl"
      : customApplied
        ? `/reports/pnl${qs({ fromDate, toDate })}`
        : null
  );

  const applyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApplied(true);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Profit & Loss"
        subtitle="Revenue minus COGS and expenses, rolled up across common windows. Shipping is pass-through; absorbed shipping belongs under DELIVERY_COST expenses."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs">
        {([
          ["rolling", "Rolling windows"],
          ["custom", "Custom range"],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              if (m === "rolling") setCustomApplied(false);
            }}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition ${
              mode === m ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "custom" && (
        <form onSubmit={applyCustom} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>From</span>
            <input type="date" className={inputClass} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>To</span>
            <input type="date" className={inputClass} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <PrimaryButton type="submit">
            <CalendarRange className="mr-2 h-4 w-4" /> Run Report
          </PrimaryButton>
          {!customApplied && (
            <p className="text-xs text-slate-500">Pick a range and click Run Report.</p>
          )}
        </form>
      )}

      {pnl.loading && !pnl.data ? (
        <Spinner label="Running Profit & Loss..." />
      ) : pnl.error ? (
        <ErrorBox message={pnl.error} onRetry={pnl.reload} />
      ) : pnl.data ? (
        isPnlRolling(pnl.data) ? (
          <RollingReport report={pnl.data} />
        ) : (
          <CustomRangeReport report={pnl.data} />
        )
      ) : null}
    </div>
  );
}

function RollingReport({ report }: { report: PnlRollingReport }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[11px] font-semibold text-slate-400">
        Currency {report.currency} · Timezone {report.timezone}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {report.periods.map((p) => (
          <PeriodCard key={p.key} period={p} />
        ))}
      </div>
    </div>
  );
}

function CustomRangeReport({ report }: { report: PnlCustomRangeReport }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-semibold text-slate-400">
        {report.range.label} · {formatRangeLabel(report.range.from, report.range.to)} · Currency {report.currency}
      </p>
      <TotalsPanel totals={report.totals} />
    </div>
  );
}

function PeriodCard({ period }: { period: PnlPeriod }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-extrabold text-slate-900">{period.label}</h3>
        <span className="text-[11px] font-semibold text-slate-400">{formatRangeLabel(period.from, period.to)}</span>
      </div>
      <TotalsPanel totals={period.totals} compact />
    </section>
  );
}

function TotalsPanel({ totals, compact = false }: { totals: PnlPeriodTotals; compact?: boolean }) {
  const expenseEntries = Object.entries(totals.expensesByType) as [ExpenseType, number][];
  const netIsPositive = totals.netProfit >= 0;
  return (
    <div className={`mt-4 ${compact ? "" : "max-w-3xl"}`}>
      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        <Stat label="Revenue" value={formatBDT(totals.revenue)} tone="text-slate-900" icon={<Wallet className="h-4 w-4" />} tint="bg-blue-50 text-blue-700" />
        <Stat label="COGS" value={formatBDT(totals.cogs)} tone="text-slate-900" icon={<TrendingDown className="h-4 w-4" />} tint="bg-amber-50 text-amber-700" />
        <Stat label="Gross profit" value={formatBDT(totals.grossProfit)} tone="text-emerald-700" icon={<TrendingUp className="h-4 w-4" />} tint="bg-emerald-50 text-emerald-700" />
        <Stat label="Expenses" value={formatBDT(totals.expensesTotal)} tone="text-rose-700" icon={<TrendingDown className="h-4 w-4" />} tint="bg-rose-50 text-rose-700" />
      </div>

      <div className={`mt-4 flex items-baseline justify-between gap-4 rounded-2xl p-4 ${netIsPositive ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Net profit</div>
          <div className={`text-2xl font-extrabold ${netIsPositive ? "text-emerald-700" : "text-rose-700"}`}>{formatBDT(totals.netProfit)}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Margin</div>
          <div className={`text-2xl font-extrabold ${netIsPositive ? "text-emerald-700" : "text-rose-700"}`}>{totals.margin.toFixed(2)}%</div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <Row k="Orders" v={totals.orders.toLocaleString()} />
        <Row k="Shipping collected" v={formatBDT(totals.shippingCollected)} />
        <Row k="Discount" v={formatBDT(totals.discount)} />
        <Row k="Admin discount" v={formatBDT(totals.adminDiscount)} />
      </dl>

      {expenseEntries.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expenses by type</div>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {expenseEntries.map(([type, amount]) => (
              <li key={type} className="rounded-lg bg-slate-100 px-2.5 py-1">
                <span className="font-semibold text-slate-600">{EXPENSE_TYPE_LABELS[type]}</span>{" "}
                <span className="font-extrabold text-slate-900">{formatBDT(amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone, icon, tint }: { label: string; value: string; tone: string; icon: React.ReactNode; tint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
      </div>
      <div className={`mt-1 text-lg font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-bold text-slate-800">{v}</dd>
    </div>
  );
}

function formatRangeLabel(from: string, to: string) {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(from)} → ${fmt(to)}`;
}
