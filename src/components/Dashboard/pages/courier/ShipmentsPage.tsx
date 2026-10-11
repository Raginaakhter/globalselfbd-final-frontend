"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye } from "lucide-react";
import type {
  CourierBookingStatus,
  CourierDeliveryStatus,
  CourierSettlementStatus,
  CourierShipmentListItem,
} from "@/lib/backend-types";
import { qs, useApiQuery, type Pagination } from "../../api";
import { formatBDT } from "../../format";
import {
  EmptyState,
  ErrorBox,
  PageHeader,
  Pager,
  SearchBox,
  Spinner,
  selectClass,
  useDebounced,
} from "../../ui";
import {
  BookingStatusBadge,
  COURIER_BASE,
  DeliveryStatusBadge,
  SettlementStatusBadge,
  formatDateTime,
} from "./shared";

const BOOKING_OPTIONS: { value: CourierBookingStatus | ""; label: string }[] = [
  { value: "", label: "All booking statuses" },
  { value: "SUCCESS", label: "Booked" },
  { value: "FAILED", label: "Failed" },
  { value: "UNCERTAIN", label: "Uncertain" },
  { value: "IN_PROGRESS", label: "In progress" },
];

const DELIVERY_OPTIONS: { value: CourierDeliveryStatus | ""; label: string }[] = [
  { value: "", label: "All delivery statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In review" },
  { value: "hold", label: "On hold" },
  { value: "delivered", label: "Delivered" },
  { value: "partial_delivered", label: "Partial delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "exceptional", label: "Exceptional" },
  { value: "unknown", label: "Unknown" },
  { value: "delivered_approval_pending", label: "Delivered · pending approval" },
  { value: "partial_delivered_approval_pending", label: "Partial · pending approval" },
  { value: "cancelled_approval_pending", label: "Cancelled · pending approval" },
  { value: "unknown_approval_pending", label: "Unknown · pending approval" },
];

const SETTLEMENT_OPTIONS: { value: CourierSettlementStatus | ""; label: string }[] = [
  { value: "", label: "All settlements" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_SETTLED", label: "Partially settled" },
  { value: "SETTLED", label: "Settled" },
  { value: "UNDER_RECONCILIATION", label: "Reconciling" },
  { value: "DISPUTED", label: "Disputed" },
];

export default function CourierShipmentsPage() {
  const [search, setSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState<CourierBookingStatus | "">("");
  const [deliveryStatus, setDeliveryStatus] = useState<CourierDeliveryStatus | "">("");
  const [settlementStatus, setSettlementStatus] = useState<CourierSettlementStatus | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const shipments = useApiQuery<{ shipments: CourierShipmentListItem[]; pagination: Pagination }>(
    `/admin/courier/shipments${qs({ search: q, bookingStatus, deliveryStatus, settlementStatus, fromDate, toDate, page, limit: 20 })}`
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Shipments"
        subtitle="All parcels booked with Steadfast. Search by order #, phone, consignment ID or tracking code."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Order #, phone, consignment or tracking..." />
        <select className={selectClass} value={bookingStatus} onChange={(e) => { setBookingStatus(e.target.value as CourierBookingStatus | ""); setPage(1); }}>
          {BOOKING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className={selectClass} value={deliveryStatus} onChange={(e) => { setDeliveryStatus(e.target.value as CourierDeliveryStatus | ""); setPage(1); }}>
          {DELIVERY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className={selectClass} value={settlementStatus} onChange={(e) => { setSettlementStatus(e.target.value as CourierSettlementStatus | ""); setPage(1); }}>
          {SETTLEMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        {shipments.loading && !shipments.data ? (
          <Spinner label="Loading shipments..." />
        ) : shipments.error ? (
          <ErrorBox message={shipments.error} onRetry={shipments.reload} />
        ) : !shipments.data?.shipments.length ? (
          <EmptyState title="No shipments" text="Book your first parcel from an order's detail page." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Order #</th>
                  <th className="px-3 py-3.5">Date</th>
                  <th className="px-3 py-3.5">Customer</th>
                  <th className="px-3 py-3.5">Consignment / Tracking</th>
                  <th className="px-3 py-3.5">Booking</th>
                  <th className="px-3 py-3.5">Courier status</th>
                  <th className="px-3 py-3.5">Settlement</th>
                  <th className="px-3 py-3.5 text-right">Order total</th>
                  <th className="px-3 py-3.5 text-right">COD</th>
                  <th className="px-3 py-3.5 text-right">Outstanding</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.data.shipments.map((s) => (
                  <tr key={s._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <Link href={`${COURIER_BASE}/shipments/${s._id}`} className="font-mono text-sm font-bold text-slate-900 hover:underline">
                        {s.orderNumber}
                      </Link>
                      {s.invoice && s.invoice !== s.orderNumber && (
                        <div className="font-mono text-[10px] text-slate-500">Inv: {s.invoice}</div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-500">{formatDateTime(s.createdAt)}</td>
                    <td className="px-3 py-4">
                      <div className="font-semibold text-slate-800">{s.customerName || "—"}</div>
                      <div className="text-[11px] text-slate-500">{s.customerPhone || "—"}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="font-mono text-slate-700">{s.consignmentId || "—"}</div>
                      <div className="font-mono text-[10px] text-slate-500">{s.trackingCode || "—"}</div>
                    </td>
                    <td className="px-3 py-4"><BookingStatusBadge value={s.bookingStatus} /></td>
                    <td className="px-3 py-4"><DeliveryStatusBadge value={s.deliveryStatus} /></td>
                    <td className="px-3 py-4"><SettlementStatusBadge value={s.settlementStatus} /></td>
                    <td className="px-3 py-4 text-right text-slate-700">{formatBDT(s.orderTotal)}</td>
                    <td className="px-3 py-4 text-right text-slate-700">{formatBDT(s.codAmountSubmitted)}</td>
                    <td className={`px-3 py-4 text-right font-bold ${s.codOutstanding > 0 ? "text-rose-700" : "text-slate-500"}`}>
                      {formatBDT(s.codOutstanding)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`${COURIER_BASE}/shipments/${s._id}`}
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
    </div>
  );
}
