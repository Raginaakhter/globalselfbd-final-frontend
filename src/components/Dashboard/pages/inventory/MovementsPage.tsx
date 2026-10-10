"use client";

import Link from "next/link";
import { useState } from "react";
import type { StockMovement, StockMovementType } from "@/lib/backend-types";
import { qs, useApiQuery, type Pagination } from "../../api";
import { formatBDT, formatShortDate } from "../../format";
import {
  EmptyState,
  ErrorBox,
  PageHeader,
  Pager,
  Spinner,
  selectClass,
} from "../../ui";
import { INVENTORY_BASE, MovementTypeBadge, signedQty } from "./shared";

export default function MovementsPage() {
  const [type, setType] = useState<StockMovementType | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const types = useApiQuery<StockMovementType[]>("/admin/inventory/movements/types");
  const movements = useApiQuery<{ movements: StockMovement[]; pagination: Pagination }>(
    `/admin/inventory/movements${qs({ type, fromDate, toDate, page, limit: 30 })}`
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Stock Movements"
        subtitle="Append-only audit log of every stock change — purchases, sales, returns, adjustments and manual updates."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <select className={selectClass} value={type} onChange={(e) => { setType(e.target.value as StockMovementType | ""); setPage(1); }}>
          <option value="">All types</option>
          {types.data?.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          From
          <input type="date" className={selectClass} value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
        </label>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          To
          <input type="date" className={selectClass} value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
        </label>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {movements.loading && !movements.data ? (
          <Spinner label="Loading movements..." />
        ) : movements.error ? (
          <ErrorBox message={movements.error} onRetry={movements.reload} />
        ) : !movements.data?.movements.length ? (
          <EmptyState title="No stock movements" text="Movements appear as soon as any stock change happens anywhere." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-3 py-3.5">Type</th>
                  <th className="px-3 py-3.5">Product</th>
                  <th className="px-3 py-3.5 text-right">Qty</th>
                  <th className="px-3 py-3.5 text-right">Previous</th>
                  <th className="px-3 py-3.5 text-right">New</th>
                  <th className="px-3 py-3.5 text-right">Unit cost</th>
                  <th className="px-3 py-3.5">By</th>
                  <th className="px-6 py-3.5">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.data.movements.map((m, i) => {
                  const prod = typeof m.productId === "object" ? m.productId : null;
                  const by = typeof m.createdBy === "object" ? m.createdBy?.fullName : null;
                  return (
                    <tr key={m._id ?? i} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-3 text-slate-500">{formatShortDate(m.createdAt)}</td>
                      <td className="px-3 py-3"><MovementTypeBadge value={m.type} /></td>
                      <td className="px-3 py-3">
                        {prod?._id ? (
                          <Link href={`${INVENTORY_BASE}/products/${prod._id}`} className="text-sm font-semibold text-slate-800 hover:underline">
                            {prod.productTitle || "—"}
                          </Link>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        {prod?.sku && <div className="font-mono text-[10px] text-slate-500">{prod.sku}</div>}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-800">{signedQty(m.type, m.quantity)}</td>
                      <td className="px-3 py-3 text-right text-slate-500">{m.previousStock}</td>
                      <td className="px-3 py-3 text-right text-slate-800">{m.newStock}</td>
                      <td className="px-3 py-3 text-right text-slate-500">{m.unitCost != null ? formatBDT(m.unitCost) : "—"}</td>
                      <td className="px-3 py-3 text-slate-500">{by || "System"}</td>
                      <td className="px-6 py-3 text-slate-500">{m.reason || (m.orderId ? `Order ${String(m.orderId).slice(-6)}` : (m.shipmentId ? `Shipment ${String(m.shipmentId).slice(-6)}` : "—"))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={movements.data?.pagination ?? null} onPage={setPage} />
      </div>
    </div>
  );
}
