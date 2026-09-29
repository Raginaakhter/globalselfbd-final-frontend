"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowDownUp, Banknote, CalendarDays, Copy, ExternalLink, Eye, FilePlus2, FileText, Filter, Printer, RefreshCw, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { InvoiceDateRange, InvoiceListItem, InvoiceSummary } from "@/lib/backend-types";
import { BASE } from "../AppSidebar";
import { qs, useApiAction, useApiQuery } from "../api";
import { formatBDT } from "../format";
import { EmptyState, ErrorBox, PageHeader, Pager, PrimaryButton, SearchBox, Spinner, StatusPill, useDebounced } from "../ui";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "./orderShared";

const DATE_RANGES: { value: InvoiceDateRange | "" | "custom"; label: string }[] = [
  { value: "", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7Days", label: "Last 7 days" },
  { value: "last30Days", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "custom", label: "Custom range" },
];
const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amountHigh", label: "Amount: High to Low" },
  { value: "amountLow", label: "Amount: Low to High" },
];
const ROWS = [10, 20, 50, 100];

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const formatDate = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** A select that looks like the pill filters in the design. */
function FilterSelect({ icon, value, onChange, children, prefix }: { icon?: React.ReactNode; value: string | number; onChange: (v: string) => void; children: React.ReactNode; prefix?: string }) {
  return (
    <label className="relative flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white pr-3 pl-4 text-sm font-semibold text-slate-700 shadow-2xs transition focus-within:ring-2 focus-within:ring-blue-600 hover:bg-slate-50">
      {icon}
      {prefix && <span className="text-xs font-medium text-slate-400">{prefix}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-full cursor-pointer appearance-none bg-transparent pr-6 outline-none">
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </label>
  );
}

export default function InvoicesPage() {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState(false);
  const q = useDebounced(search);

  const custom = dateRange === "custom";
  const invoices = useApiQuery<InvoiceListItem[]>(
    `/invoices${qs({
      search: q,
      dateRange: custom ? "" : dateRange,
      fromDate: custom ? fromDate : "",
      toDate: custom ? toDate : "",
      paymentStatus,
      orderStatus,
      sort,
      page,
      limit,
    })}`
  );
  const summary = invoices.response?.summary as InvoiceSummary | undefined;

  // Every filter change starts again from page 1
  const change = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const generateMissing = async () => {
    setGenerating(true);
    const res = await action<{ created: number }>("/invoices/generate-missing", { method: "POST" });
    setGenerating(false);
    if (res) invoices.reload();
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${text}`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const cards = [
    { title: "Total Invoices", value: summary ? summary.totalInvoices.toLocaleString("en-US") : null, icon: FileText, tone: "bg-blue-50 text-blue-600 border-blue-100" },
    { title: "Total Sales", value: summary ? formatBDT(summary.totalSales) : null, icon: Banknote, tone: "bg-emerald-50 text-emerald-600 border-emerald-100", hint: summary && `Products ${formatBDT(summary.totalProductSales)} · Shipping ${formatBDT(summary.totalShipping)}` },
    { title: "Today's Invoices", value: summary ? summary.todayInvoices.toLocaleString("en-US") : null, icon: CalendarDays, tone: "bg-violet-50 text-violet-600 border-violet-100" },
    { title: "Today's Sales", value: summary ? formatBDT(summary.todaySales) : null, icon: TrendingUp, tone: "bg-amber-50 text-amber-500 border-amber-100", hint: summary && `Products ${formatBDT(summary.todayProductSales)} · Shipping ${formatBDT(summary.todayShipping)}` },
  ];

  const iconButton = "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition";

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Invoices" subtitle="Every confirmed order gets an invoice automatically. View, print or share them here.">
        {hasPermission("invoices.create") && (
          <PrimaryButton onClick={generateMissing} loading={generating} title="Create invoices for older orders that have none">
            <FilePlus2 className="mr-2 h-4 w-4" /> Generate Missing
          </PrimaryButton>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, tone, hint }) => (
          <div key={title} className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="min-w-0">
              <p className="text-sm font-extrabold tracking-wider text-slate-500 uppercase">{title}</p>
              <p className="mt-2 truncate text-3xl font-black text-slate-900">{value ?? <span className="inline-block h-8 w-24 animate-pulse rounded-lg bg-slate-100" />}</p>
              {hint && <p className="mt-1 truncate text-[11px] text-slate-400">{hint}</p>}
            </div>
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${tone}`}>
              <Icon className="h-6 w-6" />
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs lg:flex-row lg:items-center">
        <div className="w-full lg:max-w-sm">
          <SearchBox value={search} onChange={change(setSearch)} placeholder="Search Invoice #, Order #, Customer, Phone..." />
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <FilterSelect icon={<CalendarDays className="h-4 w-4 text-slate-500" />} value={dateRange} onChange={change(setDateRange)}>
            {DATE_RANGES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </FilterSelect>
          {custom && (
            <>
              <input type="date" value={fromDate} onChange={(e) => change(setFromDate)(e.target.value)} title="From date" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none" />
              <input type="date" value={toDate} onChange={(e) => change(setToDate)(e.target.value)} title="To date" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none" />
            </>
          )}
          <FilterSelect icon={<Filter className="h-4 w-4 text-slate-500" />} value={paymentStatus} onChange={change(setPaymentStatus)}>
            <option value="">All Payment Status</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={orderStatus} onChange={change(setOrderStatus)}>
            <option value="">All Order Status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect icon={<ArrowDownUp className="h-4 w-4 text-slate-500" />} value={sort} onChange={change(setSort)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect prefix="Rows:" value={limit} onChange={(v) => change(() => setLimit(Number(v)))(v)}>
            {ROWS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </FilterSelect>
          <button onClick={invoices.reload} title="Refresh" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${invoices.loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {invoices.loading && !invoices.data ? (
          <Spinner label="Loading invoices..." />
        ) : invoices.error ? (
          <ErrorBox message={invoices.error} onRetry={invoices.reload} />
        ) : !invoices.data?.length ? (
          <EmptyState
            title="No invoices found"
            text={search || dateRange || paymentStatus || orderStatus ? "No invoice matches your filters." : "Invoices are created when an order is confirmed. Older orders can get one with Generate Missing."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-4 py-4">Order No</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Grand Total</th>
                  <th className="px-4 py-4">Payment</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Invoice Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.data.map((inv) => {
                  const view = `${BASE}/invoices/${encodeURIComponent(inv.invoiceNumber)}`;
                  return (
                    <tr key={inv._id} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-4 font-bold whitespace-nowrap text-slate-900">
                        <Link href={view} className="hover:text-blue-600">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs whitespace-nowrap text-slate-500">{inv.orderNumber}</td>
                      <td className="px-4 py-4 font-semibold whitespace-nowrap text-slate-800">{inv.customerName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-500">{inv.customerPhone}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">{formatBDT(inv.totalAmount)}</div>
                        {inv.discount > 0 && <div className="text-[11px] text-slate-400">− {formatBDT(inv.discount)}{inv.couponCode ? ` (${inv.couponCode})` : ""}</div>}
                        {inv.refundAmount > 0 && <div className="text-[11px] font-semibold text-rose-500">Refunded {formatBDT(inv.refundAmount)}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill value={inv.paymentStatus} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill value={inv.orderStatus} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-500">{formatDate(inv.issuedAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={view} title="View invoice" className={`${iconButton} border-slate-200 text-slate-600 hover:bg-slate-50`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link href={`${view}?print=1`} title="Print invoice" className={`${iconButton} border-emerald-200 text-emerald-600 hover:bg-emerald-50`}>
                            <Printer className="h-4 w-4" />
                          </Link>
                          <Link href={`${BASE}/orders/${inv.orderId}`} title="Open order" className={`${iconButton} border-blue-200 text-blue-600 hover:bg-blue-50`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button onClick={() => copy(inv.invoiceNumber)} title="Copy invoice number" className={`${iconButton} border-violet-200 text-violet-600 hover:bg-violet-50`}>
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={invoices.pagination} onPage={setPage} />
      </div>
      {summary?.basis && <p className="text-[11px] text-slate-400">{summary.basis}</p>}
    </div>
  );
}
