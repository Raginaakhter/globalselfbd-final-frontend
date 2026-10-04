"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Check, Eye, NotebookPen, Pencil, RefreshCw, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminOrder, AdminOrderListItem, OrderStatus, PaymentStatus } from "@/lib/backend-types";
import { PAYMENT_METHOD_LABELS, PRE_ORDER_MAX_DAYS, PRE_ORDER_MIN_DAYS } from "@/lib/backend-types";
import { ORDER_STATUS_FLOW, ORDER_STATUSES, formatShortDate } from "@/lib/order-status";
import { BASE } from "../AppSidebar";
import { useApiAction } from "../api";
import { formatBDT } from "../format";
import { EmptyState, ErrorBox, FieldError, Modal, Pager, PrimaryButton, SearchBox, Spinner, StatusPill, inputClass, labelClass, selectClass, useConfirm } from "../ui";

export { PAYMENT_METHOD_LABELS, ORDER_STATUSES, ORDER_STATUS_FLOW };
export const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "-";

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";

/** PATCH/POST helpers for the order state machines and pre-order extras. */
export function useOrderMutations() {
  const action = useApiAction();
  return {
    /** cancellationReason is only sent with CANCELLED; cancelledBy is set server-side from the session. */
    setStatus: (id: string, status: OrderStatus, cancellationReason?: string) =>
      action<AdminOrder>(`/admin/orders/${id}/status`, {
        method: "PATCH",
        json: status === "CANCELLED" && cancellationReason?.trim() ? { status, cancellationReason: cancellationReason.trim() } : { status },
      }),
    setPaymentStatus: (id: string, paymentStatus: PaymentStatus) =>
      action<AdminOrder>(`/admin/orders/${id}/payment-status`, { method: "PATCH", json: { paymentStatus } }),
    /** Send preOrderMinDays (re-bases from createdAt) and/or a future expectedDeliveryDate. */
    setPreOrder: (id: string, body: { preOrderMinDays?: number; expectedDeliveryDate?: string }) =>
      action<AdminOrder>(`/admin/orders/${id}/pre-order`, { method: "PATCH", json: body }, "Pre-order details updated"),
    addNote: (id: string, note: string) => action<AdminOrder>(`/admin/orders/${id}/notes`, { method: "POST", json: { note } }, "Admin note added"),
  };
}

export type OrderTypeFilter = "" | "preOrder" | "normal";

export interface OrderFilters {
  search: string;
  status: string;
  paymentStatus: string;
  type: OrderTypeFilter;
  fromDate: string;
  toDate: string;
}

export const EMPTY_FILTERS: OrderFilters = { search: "", status: "", paymentStatus: "", type: "", fromDate: "", toDate: "" };

export function OrderFilterBar({
  value,
  onChange,
  hideTypeFilter = false,
}: {
  value: OrderFilters;
  onChange: (f: OrderFilters) => void;
  hideTypeFilter?: boolean;
}) {
  const set = (k: keyof OrderFilters) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <SearchBox value={value.search} onChange={set("search")} placeholder="Order number, name, phone or email..." />
      <select className={selectClass} value={value.status} onChange={(e) => set("status")(e.target.value)}>
        <option value="">All order statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {!hideTypeFilter && (
        <select className={selectClass} value={value.type} onChange={(e) => set("type")(e.target.value)} title="Order type">
          <option value="">All order types</option>
          <option value="preOrder">Pre-orders only</option>
          <option value="normal">Normal orders only</option>
        </select>
      )}
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
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const action = useApiAction();
  const canDelete = hasPermission("orders.delete");
  const canUpdate = hasPermission("orders.update");
  const canStatus = hasPermission("orders.status");

  const [editPreOrder, setEditPreOrder] = useState<AdminOrderListItem | null>(null);
  const [editStatus, setEditStatus] = useState<AdminOrderListItem | null>(null);
  const [addNoteFor, setAddNoteFor] = useState<AdminOrderListItem | null>(null);

  const removeOrder = async (o: AdminOrderListItem) => {
    const ok = await confirm({
      title: "Delete order?",
      text: `Are you sure you want to delete order "${o.orderNumber}"? Stock for normal items and coupons will be restored. This cannot be undone.`,
      confirmText: "Yes, Delete Order",
    });
    if (ok) {
      const res = await action(`/admin/orders/${o._id}`, { method: "DELETE" }, "Order deleted successfully");
      if (res) onRetry();
    }
  };

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
                <th className="px-6 py-3.5 text-right">Actions</th>
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
                    {o.isPreOrder && (
                      <div className="mt-1 flex flex-col items-start gap-0.5">
                        <button
                          type="button"
                          disabled={!canUpdate}
                          onClick={() => setEditPreOrder(o)}
                          title={canUpdate ? "Click to edit pre-order window" : undefined}
                          className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase shadow-xs ${
                            canUpdate ? "cursor-pointer hover:brightness-110" : ""
                          }`}
                        >
                          <CalendarClock className="h-3 w-3" /> Pre-order{o.preOrderMinDays ? ` · ${o.preOrderMinDays}d` : ""}
                          {canUpdate && <Pencil className="h-2.5 w-2.5 ml-0.5 opacity-80" />}
                        </button>
                        {o.expectedDeliveryDate && (
                          <span className="text-[11px] font-semibold text-violet-700">
                            ETA {formatDate(o.expectedDeliveryDate)}
                          </span>
                        )}
                      </div>
                    )}
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
                    {(o.adminDiscountAmount ?? 0) > 0 && (
                      <div className="text-[11px] text-indigo-600">− {formatBDT(o.adminDiscountAmount ?? 0)} admin</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                    {o.fulfillmentMethod === "STORE_PICKUP" ? (
                      <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">Pickup</span>
                    ) : (
                      formatBDT(o.shippingCost)
                    )}
                  </td>
                  <td className="px-4 py-4 font-extrabold whitespace-nowrap text-slate-900">{formatBDT(o.totalAmount)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <StatusPill value={o.paymentStatus} />
                      <span className="text-slate-400">{PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod}</span>
                      {o.paymentStatus === "REFUNDED" && <span className="text-[11px] font-semibold text-rose-500">Refunded {formatBDT(o.subtotal - o.discount)}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={!canStatus || o.orderStatus === "CANCELLED" || o.orderStatus === "DELIVERED"}
                        onClick={() => setEditStatus(o)}
                        className={`inline-flex items-center gap-1.5 ${canStatus && o.orderStatus !== "CANCELLED" && o.orderStatus !== "DELIVERED" ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                        title={canStatus ? "Click to change status" : undefined}
                      >
                        <StatusPill value={o.orderStatus} />
                        {canStatus && o.orderStatus !== "CANCELLED" && o.orderStatus !== "DELIVERED" && (
                          <RefreshCw className="h-3 w-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`${BASE}/orders/${o._id}`}
                        title="View full order details"
                        className="p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {o.isPreOrder && canUpdate && (
                        <button
                          type="button"
                          onClick={() => setEditPreOrder(o)}
                          title="Edit pre-order window / ETA"
                          className="cursor-pointer p-1.5 rounded-lg text-violet-500 transition hover:bg-violet-50 hover:text-violet-700"
                        >
                          <CalendarClock className="h-4 w-4" />
                        </button>
                      )}
                      {canStatus && o.orderStatus !== "CANCELLED" && o.orderStatus !== "DELIVERED" && (
                        <button
                          type="button"
                          onClick={() => setEditStatus(o)}
                          title="Update order status"
                          className="cursor-pointer p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => setAddNoteFor(o)}
                          title="Add internal note"
                          className="cursor-pointer p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <NotebookPen className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => removeOrder(o)}
                          title="Delete order permanently"
                          className="cursor-pointer p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager pagination={pagination} onPage={onPage} />

      {/* Quick Edit Pre-Order Modal */}
      {editPreOrder && (
        <QuickPreOrderModal
          order={editPreOrder}
          onClose={() => setEditPreOrder(null)}
          onSaved={() => {
            setEditPreOrder(null);
            onRetry();
          }}
        />
      )}

      {/* Quick Status Change Modal */}
      {editStatus && (
        <QuickStatusModal
          order={editStatus}
          onClose={() => setEditStatus(null)}
          onSaved={() => {
            setEditStatus(null);
            onRetry();
          }}
        />
      )}

      {/* Quick Add Note Modal */}
      {addNoteFor && (
        <QuickAddNoteModal
          order={addNoteFor}
          onClose={() => setAddNoteFor(null)}
          onSaved={() => {
            setAddNoteFor(null);
            onRetry();
          }}
        />
      )}
    </div>
  );
}

const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

function QuickPreOrderModal({ order, onClose, onSaved }: { order: AdminOrderListItem; onClose: () => void; onSaved: () => void }) {
  const { setPreOrder } = useOrderMutations();
  const [mode, setMode] = useState<"days" | "date">("days");
  const [days, setDays] = useState(String(order.preOrderMinDays || PRE_ORDER_MIN_DAYS));
  const [date, setDate] = useState(toDateInput(order.expectedDeliveryDate));
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const daysNum = Number(days);
  const rebased = Number.isInteger(daysNum) ? new Date(new Date(order.createdAt).getTime() + daysNum * 86_400_000).toISOString() : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let body: { preOrderMinDays?: number; expectedDeliveryDate?: string };
    if (mode === "days") {
      if (!Number.isInteger(daysNum) || daysNum < PRE_ORDER_MIN_DAYS || daysNum > PRE_ORDER_MAX_DAYS)
        return setError(`Days must be a whole number between ${PRE_ORDER_MIN_DAYS} and ${PRE_ORDER_MAX_DAYS}.`);
      body = { preOrderMinDays: daysNum };
    } else {
      if (!date) return setError("Pick a date.");
      const d = new Date(`${date}T00:00:00Z`);
      if (d.getTime() <= Date.now()) return setError("Expected delivery date must be in the future.");
      body = { expectedDeliveryDate: d.toISOString() };
    }
    setError(undefined);
    setSaving(true);
    const res = await setPreOrder(order._id, body);
    setSaving(false);
    if (res) onSaved();
  };

  return (
    <Modal open onClose={onClose} className="max-w-sm">
      <form onSubmit={save} className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <CalendarClock className="h-5 w-5 text-violet-600" /> Edit Pre-Order Window
          </h2>
          <p className="text-xs text-slate-500">Order {order.orderNumber}</p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {([
            ["days", "Change days"],
            ["date", "Set date"],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => (setMode(m), setError(undefined))}
              className={`flex-1 cursor-pointer rounded-lg py-1.5 ${mode === m ? "bg-white shadow-xs" : "text-slate-500"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "days" ? (
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Days ({PRE_ORDER_MIN_DAYS}–{PRE_ORDER_MAX_DAYS})</span>
            <input type="number" min={PRE_ORDER_MIN_DAYS} max={PRE_ORDER_MAX_DAYS} step={1} className={inputClass} value={days} onChange={(e) => setDays(e.target.value)} autoFocus />
            {rebased && <span className="text-[11px] text-slate-500">New expected ETA: {formatDate(rebased)}</span>}
          </label>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Expected delivery date</span>
            <input type="date" min={toDateInput(new Date(Date.now() + 86_400_000).toISOString())} className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} autoFocus />
          </label>
        )}

        <FieldError message={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={saving}>
            Save
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function QuickStatusModal({ order, onClose, onSaved }: { order: AdminOrderListItem; onClose: () => void; onSaved: () => void }) {
  const { setStatus } = useOrderMutations();
  const [status, setStatusVal] = useState<OrderStatus>(order.orderStatus);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const isCancel = status === "CANCELLED";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await setStatus(order._id, status, isCancel ? reason : undefined);
    setSaving(false);
    if (res) onSaved();
  };

  return (
    <Modal open onClose={onClose} className="max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Update Order Status</h2>
          <p className="text-xs text-slate-500">Order {order.orderNumber}</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Status</span>
          <select value={status} onChange={(e) => setStatusVal(e.target.value as OrderStatus)} className={inputClass}>
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>

        {isCancel && (
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Cancellation Reason (optional)</span>
            <textarea
              className={inputClass}
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer request or supplier delay"
            />
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={saving} className={isCancel ? "bg-rose-600 hover:bg-rose-700" : ""}>
            {isCancel ? "Confirm Cancel" : "Update Status"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function QuickAddNoteModal({ order, onClose, onSaved }: { order: AdminOrderListItem; onClose: () => void; onSaved: () => void }) {
  const { addNote } = useOrderMutations();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    const res = await addNote(order._id, note.trim());
    setSaving(false);
    if (res) onSaved();
  };

  return (
    <Modal open onClose={onClose} className="max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <NotebookPen className="h-5 w-5 text-indigo-600" /> Add Admin Note
          </h2>
          <p className="text-xs text-slate-500">Order {order.orderNumber} (internal append-only note)</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Note</span>
          <textarea
            className={inputClass}
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Supplier confirmed stock shipment departing tomorrow."
            autoFocus
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={saving} disabled={!note.trim()}>
            Add Note
          </PrimaryButton>
        </div>
      </form>
    </Modal>
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
