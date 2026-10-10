"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProfitReport, PurchaseReport, Supplier, ValuationReport } from "@/lib/backend-types";
import { qs, useApiQuery } from "../../api";
import { formatBDT, formatShortDate } from "../../format";
import {
  EmptyState,
  ErrorBox,
  PageHeader,
  Spinner,
  selectClass,
} from "../../ui";
import { INVENTORY_BASE, ShipmentStatusBadge } from "./shared";

/** Profit report page: Revenue - COGS = Profit per product, with totals. */
export function ProfitReportPage() {
  const [limit, setLimit] = useState("100");
  const report = useApiQuery<ProfitReport>(`/admin/inventory/reports/profit${qs({ limit })}`);

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Profit & Loss" subtitle="Revenue, COGS (FIFO consumption), gross profit and margin per product.">
        <select className={selectClass} value={limit} onChange={(e) => setLimit(e.target.value)}>
          {["25", "50", "100", "250", "500"].map((n) => (
            <option key={n} value={n}>Top {n}</option>
          ))}
        </select>
      </PageHeader>

      {report.loading && !report.data ? (
        <Spinner label="Loading profit report..." />
      ) : report.error ? (
        <ErrorBox message={report.error} onRetry={report.reload} />
      ) : !report.data?.rows.length ? (
        <EmptyState title="No sales yet" text="Deliver orders to generate a profit report." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Revenue" value={formatBDT(report.data.totals.revenue)} tone="bg-blue-50 text-blue-700" />
            <SummaryCard label="COGS" value={formatBDT(report.data.totals.cogs)} tone="bg-slate-100 text-slate-700" />
            <SummaryCard label="Gross profit" value={formatBDT(report.data.totals.profit)} tone="bg-emerald-50 text-emerald-700" />
            <SummaryCard label="Margin" value={`${report.data.totals.margin.toFixed(2)}%`} tone="bg-indigo-50 text-indigo-700" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-3 py-3.5">SKU</th>
                    <th className="px-3 py-3.5 text-right">Sold</th>
                    <th className="px-3 py-3.5 text-right">Revenue</th>
                    <th className="px-3 py-3.5 text-right">COGS</th>
                    <th className="px-3 py-3.5 text-right">Profit</th>
                    <th className="px-6 py-3.5 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.data.rows.map((row) => (
                    <tr key={row.productId} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-3.5">
                        <Link href={`${INVENTORY_BASE}/products/${row.productId}`} className="text-sm font-bold text-slate-900 hover:underline">
                          {row.productTitle}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-500">{row.sku || "—"}</td>
                      <td className="px-3 py-3.5 text-right">{row.soldQuantity.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-right text-slate-700">{formatBDT(row.revenue)}</td>
                      <td className="px-3 py-3.5 text-right text-slate-500">{formatBDT(row.cogs)}</td>
                      <td className="px-3 py-3.5 text-right font-bold text-emerald-700">{formatBDT(row.profit)}</td>
                      <td className="px-6 py-3.5 text-right text-slate-500">{row.margin.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Current stock × unit cost and × sell price. */
export function ValuationReportPage() {
  const report = useApiQuery<ValuationReport>("/admin/inventory/reports/valuation");

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Inventory Valuation" subtitle="Snapshot of what current stock is worth at cost and at sell price." />

      {report.loading && !report.data ? (
        <Spinner label="Loading valuation..." />
      ) : report.error ? (
        <ErrorBox message={report.error} onRetry={report.reload} />
      ) : !report.data?.rows.length ? (
        <EmptyState title="No stock" text="Receive shipments to build inventory value." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Cost value" value={formatBDT(report.data.totals.costValue)} tone="bg-amber-50 text-amber-700" />
            <SummaryCard label="Sell value" value={formatBDT(report.data.totals.sellValue)} tone="bg-emerald-50 text-emerald-700" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-3 py-3.5">SKU</th>
                    <th className="px-3 py-3.5 text-right">Stock</th>
                    <th className="px-3 py-3.5 text-right">Unit cost</th>
                    <th className="px-3 py-3.5 text-right">Sell price</th>
                    <th className="px-3 py-3.5 text-right">Cost value</th>
                    <th className="px-6 py-3.5 text-right">Sell value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.data.rows.map((row, i) => (
                    <tr key={row.productId ?? i} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-3.5">
                        {row.productId ? (
                          <Link href={`${INVENTORY_BASE}/products/${row.productId}`} className="text-sm font-bold text-slate-900 hover:underline">
                            {row.productTitle}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold text-slate-900">{row.productTitle}</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-500">{row.sku || "—"}</td>
                      <td className="px-3 py-3.5 text-right">{row.stock.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-right">{formatBDT(row.unitCost)}</td>
                      <td className="px-3 py-3.5 text-right">{formatBDT(row.sellPrice)}</td>
                      <td className="px-3 py-3.5 text-right text-amber-700 font-bold">{formatBDT(row.costValue)}</td>
                      <td className="px-6 py-3.5 text-right text-emerald-700 font-bold">{formatBDT(row.sellValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Shipment-level purchase report. */
export function PurchaseReportPage() {
  const [supplierId, setSupplierId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const suppliers = useApiQuery<{ suppliers: Supplier[] }>("/admin/inventory/suppliers?status=ACTIVE&limit=200");
  const report = useApiQuery<PurchaseReport>(
    `/admin/inventory/reports/purchases${qs({ supplierId, fromDate, toDate })}`
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Purchase Report" subtitle="Shipments with totals, grouped by filter.">
        <select className={selectClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">All suppliers</option>
          {suppliers.data?.suppliers.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          From
          <input type="date" className={selectClass} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          To
          <input type="date" className={selectClass} value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
      </PageHeader>

      {report.loading && !report.data ? (
        <Spinner label="Loading purchases..." />
      ) : report.error ? (
        <ErrorBox message={report.error} onRetry={report.reload} />
      ) : !report.data?.shipments.length ? (
        <EmptyState title="No purchases" text="No shipment matches the current filters." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Subtotal" value={formatBDT(report.data.totals.subtotal)} tone="bg-sky-50 text-sky-700" />
            <SummaryCard label="Total cost" value={formatBDT(report.data.totals.totalCost)} tone="bg-amber-50 text-amber-700" />
            <SummaryCard label="Quantity ordered" value={report.data.totals.quantity.toLocaleString()} tone="bg-indigo-50 text-indigo-700" />
            <SummaryCard label="Quantity received" value={report.data.totals.received.toLocaleString()} tone="bg-emerald-50 text-emerald-700" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-6 py-3.5">Shipment</th>
                    <th className="px-3 py-3.5">Supplier</th>
                    <th className="px-3 py-3.5">Date</th>
                    <th className="px-3 py-3.5 text-right">Items</th>
                    <th className="px-3 py-3.5 text-right">Qty</th>
                    <th className="px-3 py-3.5 text-right">Received</th>
                    <th className="px-3 py-3.5 text-right">Subtotal</th>
                    <th className="px-3 py-3.5 text-right">Total cost</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.data.shipments.map((s, i) => (
                    <tr key={s._id ?? i} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-3.5">
                        {s._id ? (
                          <Link href={`${INVENTORY_BASE}/shipments/${s._id}`} className="font-mono font-bold text-slate-900 hover:underline">
                            {s.shipmentNumber}
                          </Link>
                        ) : (
                          <span className="font-mono font-bold text-slate-900">{s.shipmentNumber}</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600">{s.supplier}</td>
                      <td className="px-3 py-3.5 text-slate-500">{formatShortDate(s.shipmentDate)}</td>
                      <td className="px-3 py-3.5 text-right">{s.totalItems}</td>
                      <td className="px-3 py-3.5 text-right">{s.quantity.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-right">{s.received.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-right text-slate-500">{formatBDT(s.subtotal)}</td>
                      <td className="px-3 py-3.5 text-right font-bold text-slate-900">{formatBDT(s.totalCost)}</td>
                      <td className="px-6 py-3.5"><ShipmentStatusBadge value={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Combined report hub with tabs for the different reports. */
export default function ReportsHubPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <PurchaseReportPage />
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs`}>
      <div className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${tone}`}>{label}</div>
      <div className="mt-2 text-xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}
