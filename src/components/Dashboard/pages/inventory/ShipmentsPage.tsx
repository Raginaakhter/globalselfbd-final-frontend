"use client";

import Link from "next/link";
import { useState } from "react";
import { CirclePlus, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Shipment, ShipmentStatus, Supplier } from "@/lib/backend-types";
import { qs, useApiQuery, type Pagination } from "../../api";
import { formatBDT, formatShortDate } from "../../format";
import {
  EmptyState,
  ErrorBox,
  Modal,
  PageHeader,
  Pager,
  PrimaryButton,
  SearchBox,
  Spinner,
  selectClass,
  useDebounced,
} from "../../ui";
import { INVENTORY_BASE, ShipmentStatusBadge } from "./shared";
import ShipmentForm from "./ShipmentForm";

const STATUS_OPTIONS: { value: ShipmentStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "PARTIALLY_RECEIVED", label: "Partially received" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function ShipmentsPage() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  const [supplierId, setSupplierId] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const q = useDebounced(search);

  const suppliers = useApiQuery<{ suppliers: Supplier[] }>("/admin/inventory/suppliers?status=ACTIVE&limit=100");
  const shipments = useApiQuery<{ shipments: Shipment[]; pagination: Pagination }>(
    `/admin/inventory/shipments${qs({ search: q, status, supplierId, page, limit: 20 })}`
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Shipments"
        subtitle="Create purchase orders, receive stock and track supplier deliveries."
      >
        {hasPermission("shipments.create") && (
          <PrimaryButton onClick={() => setShowForm(true)}>
            <CirclePlus className="mr-2 h-4 w-4" /> New Shipment
          </PrimaryButton>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by shipment number..." />
        <select className={selectClass} value={status} onChange={(e) => { setStatus(e.target.value as ShipmentStatus | ""); setPage(1); }}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className={selectClass} value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(1); }}>
          <option value="">All suppliers</option>
          {suppliers.data?.suppliers.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {shipments.loading && !shipments.data ? (
          <Spinner label="Loading shipments..." />
        ) : shipments.error ? (
          <ErrorBox message={shipments.error} onRetry={shipments.reload} />
        ) : !shipments.data?.shipments.length ? (
          <EmptyState title="No shipments" text="Create your first purchase order to start tracking inventory lots." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Shipment #</th>
                  <th className="px-3 py-3.5">Supplier</th>
                  <th className="px-3 py-3.5">Date</th>
                  <th className="px-3 py-3.5">Expected</th>
                  <th className="px-3 py-3.5 text-right">Items</th>
                  <th className="px-3 py-3.5 text-right">Qty</th>
                  <th className="px-3 py-3.5 text-right">Received</th>
                  <th className="px-3 py-3.5 text-right">Subtotal</th>
                  <th className="px-3 py-3.5 text-right">Total cost</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.data.shipments.map((s) => (
                  <tr key={s._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">{s.shipmentNumber}</td>
                    <td className="px-3 py-4 text-slate-600">
                      {typeof s.supplierId === "object" ? s.supplierId?.name ?? "—" : "—"}
                    </td>
                    <td className="px-3 py-4 text-slate-500">{formatShortDate(s.shipmentDate)}</td>
                    <td className="px-3 py-4 text-slate-500">{s.expectedDate ? formatShortDate(s.expectedDate) : "—"}</td>
                    <td className="px-3 py-4 text-right text-slate-700">{s.totalProducts ?? s.items.length}</td>
                    <td className="px-3 py-4 text-right text-slate-700">{(s.totalQuantity ?? s.items.reduce((a, i) => a + i.purchaseQuantity, 0)).toLocaleString()}</td>
                    <td className="px-3 py-4 text-right text-slate-700">{(s.totalReceived ?? s.items.reduce((a, i) => a + (i.receivedQuantity ?? 0), 0)).toLocaleString()}</td>
                    <td className="px-3 py-4 text-right text-slate-500">{formatBDT(s.subtotal)}</td>
                    <td className="px-3 py-4 text-right font-bold text-slate-900">{formatBDT(s.totalCost)}</td>
                    <td className="px-3 py-4"><ShipmentStatusBadge value={s.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`${INVENTORY_BASE}/shipments/${s._id}`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-700"
                        title="Open"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={shipments.data?.pagination ?? null} onPage={setPage} />
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} className="max-w-4xl rounded-2xl">
        {showForm && (
          <ShipmentForm
            onClose={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false);
              shipments.reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
