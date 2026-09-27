"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { AdminOrder, AdminOrderListItem, OrderStatus, PaymentStatus } from "@/lib/backend-types";
import { PAYMENT_METHOD_LABELS } from "@/lib/backend-types";
import { BASE } from "../AppSidebar";
import { useApiAction } from "../api";
import { formatBDT } from "../format";
import { EmptyState, ErrorBox, Pager, SearchBox, Spinner, StatusPill, selectClass } from "../ui";

export { PAYMENT_METHOD_LABELS };

export const ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "-";

/** PATCH helpers for the two independent order state machines. */
export function useOrderMutations() {
  const action = useApiAction();
  return {
    setStatus: (id: string, status: OrderStatus) => action<AdminOrder>(`/admin/orders/${id}/status`, { method: "PATCH", json: { status } }),
    setPaymentStatus: (id: string, paymentStatus: PaymentStatus) =>
      action<AdminOrder>(`/admin/orders/${id}/payment-status`, { method: "PATCH", json: { paymentStatus } }),
  };
}

export interface OrderFilters {
  search: string;
  status: string;
  paymentStatus: string;
  fromDate: string;
  toDate: string;
}

export const EMPTY_FILTERS: OrderFilters = { search: "", status: "", paymentStatus: "", fromDate: "", toDate: "" };

export function OrderFilterBar({ value, onChange }: { value: OrderFilters; onChange: (f: OrderFilters) => void }) {
  const set = (k: keyof OrderFilters) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <SearchBox value={value.search} onChange={set("search")} placeholder="Order number, name, phone or email..." />
      <select className={selectClass} value={value.status} onChange={(e) => set("status")(e.target.value)}>
        <option value="">All order statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select className={selectClass} value={value.paymentStatus} onChange={(e) => set("paymentStatus")(e.target.value)}>
        <option value="">All payment statuses</option>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input type="date" className={selectClass} value={value.fromDate} onChange={(e) => set("fromDate")(e.target.value)} title="From date" />
      <input type="date" className={selectClass} value={value.toDate} onChange={(e) => set("toDate")(e.target.value)} title="To date" />
    </div>
  );
}

export function OrdersTable({
  orders,
  loading,
  error,
  pagination,
  onPage,
  onRetry,
  emptyText,
}: {
  orders: AdminOrderListItem[] | null | undefined;
  loading: boolean;
  error: string | null;
  pagination: { page: number; totalPages: number; total: number } | null;
  onPage: (p: number) => void;
  onRetry: () => void;
  emptyText?: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      {loading && !orders ? (
        <Spinner label="Loading orders..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={onRetry} />
      ) : !orders?.length ? (
        <EmptyState title="No orders found" text={emptyText ?? "Orders placed by customers show up here."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                <th className="px-6 py-3.5">Order</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5">Products</th>
                <th className="px-4 py-3.5">Delivery</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o._id} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <Link href={`${BASE}/orders/${o._id}`} className="font-mono text-sm font-bold text-blue-600 hover:underline">
                      {o.orderNumber}
                    </Link>
                    <div className="text-slate-400">{formatDateTime(o.createdAt)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-800">{o.customerName}</div>
                    <div className="text-slate-400">{o.customerPhone}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {o.itemCount} item{o.itemCount === 1 ? "" : "s"} · {o.totalQuantity} pcs
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                    {formatBDT(o.subtotal)}
                    {o.discount > 0 && <div className="text-[11px] text-rose-500">− {formatBDT(o.discount)} discount</div>}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">{formatBDT(o.shippingCost)}</td>
                  <td className="px-4 py-4 font-extrabold whitespace-nowrap text-slate-900">{formatBDT(o.totalAmount)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <StatusPill value={o.paymentStatus} />
                      <span className="text-slate-400">{PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill value={o.orderStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`${BASE}/orders/${o._id}`} className="inline-block p-1.5 text-slate-400 transition hover:text-blue-600">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager pagination={pagination} onPage={onPage} />
    </div>
  );
}

/** Filter state that resets to page 1 whenever a filter changes. */
export function useOrderFilters(initial: Partial<OrderFilters> = {}) {
  const [filters, setFilters] = useState<OrderFilters>({ ...EMPTY_FILTERS, ...initial });
  const [page, setPage] = useState(1);
  return {
    filters,
    page,
    setPage,
    setFilters: (f: OrderFilters) => {
      setFilters(f);
      setPage(1);
    },
  };
}
