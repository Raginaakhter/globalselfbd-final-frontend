"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, CreditCard, FileText, MapPin, NotebookPen, Package, Pencil, Trash, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminOrder, Invoice, InvoiceListItem, OrderStatus, PaymentStatus } from "@/lib/backend-types";
import { PRE_ORDER_MAX_DAYS, PRE_ORDER_MIN_DAYS } from "@/lib/backend-types";
import { ORDER_STATUS_FLOW } from "@/lib/order-status";
import { BASE } from "../AppSidebar";
import { errorMessage, qs, useApiQuery } from "../api";
import { formatBDT } from "../format";
import { ErrorBox, FieldError, Modal, PrimaryButton, Spinner, StatusPill, inputClass, labelClass, useConfirm } from "../ui";
import { ProductThumb } from "./ProductsCatalog";
import { PAYMENT_METHOD_LABELS, formatDate, formatDateTime, useOrderMutations } from "./orderShared";

const MAX_REASON = 500;
const MAX_NOTE = 1000;

export default function OrderDetails({ orderId }: { orderId: string }) {
  const { api, hasPermission } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
  const { setStatus, setPaymentStatus } = useOrderMutations();
  const order = useApiQuery<AdminOrder>(`/admin/orders/${encodeURIComponent(orderId)}`);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (order.error) return <ErrorBox message={order.error} onRetry={order.reload} />;
  if (!order.data) return <Spinner label="Loading order..." />;
  const o = order.data;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    // The response has no customer / allowed-next fields, so reload the full detail.
    const ok = await fn();
    if (ok) await order.reload();
    setBusy(false);
    return ok;
  };

  const changeStatus = async (next: OrderStatus) => {
    // Cancelling opens a modal that captures an optional reason
    if (next === "CANCELLED") return setCancelOpen(true);
    run(() => setStatus(o._id, next));
  };

  const changePayment = async (next: PaymentStatus) => {
    if (next === "REFUNDED") {
      const ok = await confirm({
        title: `Refund ${formatBDT(o.subtotal - o.discount)}?`,
        text: `Only the product price is refunded. The delivery charge (${formatBDT(o.shippingCost)}) is not refunded. REFUNDED is final.`,
        confirmText: "Yes, Refunded",
      });
      if (!ok) return;
    }
    run(() => setPaymentStatus(o._id, next));
  };

  // POST returns the existing invoice when the order already has one; view-only roles look it up instead
  const openInvoice = async () => {
    setBusy(true);
    try {
      let invoiceNumber: string | undefined;
      if (hasPermission("invoices.create")) {
        invoiceNumber = (await api<Invoice>("/invoices", { method: "POST", body: JSON.stringify({ orderId: o._id }) })).data.invoiceNumber;
      } else {
        const res = await api<InvoiceListItem[]>(`/invoices${qs({ search: o.orderNumber, limit: 5 })}`);
        invoiceNumber = res.data.find((i) => i.orderId === o._id)?.invoiceNumber;
      }
      if (invoiceNumber) router.push(`${BASE}/invoices/${encodeURIComponent(invoiceNumber)}`);
      else toast.error("This order has no invoice yet.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not open the invoice"));
    }
    setBusy(false);
  };
  const canInvoice = !cancelledOrder(o) && (hasPermission("invoices.create") || hasPermission("invoices.view"));
  const canDelete = hasPermission("orders.delete");

  const deleteOrder = async () => {
    const ok = await confirm({
      title: "Delete order?",
      text: `Are you sure you want to permanently delete order "${o.orderNumber}"? Stock and coupons will be restored (if applicable). This cannot be undone.`,
      confirmText: "Yes, Delete Order",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api(`/admin/orders/${o._id}`, { method: "DELETE" });
      toast.success("Order deleted successfully");
      router.push(`${BASE}/orders`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete order"));
      setBusy(false);
    }
  };

  const computeFallbackStatuses = (curr: OrderStatus): OrderStatus[] => {
    if (curr === "CANCELLED" || curr === "DELIVERED") return [];
    const idx = ORDER_STATUS_FLOW.indexOf(curr);
    const list: OrderStatus[] = [];
    if (idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1) {
      list.push(ORDER_STATUS_FLOW[idx + 1]);
      if (curr === "PROCESSING" && !list.includes("SHIPPED")) list.push("SHIPPED");
      if (curr === "SHIPPED" && !list.includes("DELIVERED")) list.push("DELIVERED");
    }
    if (["PENDING", "CONFIRMED", "PROCESSING", "READY_TO_SHIP"].includes(curr)) {
      list.push("CANCELLED");
    }
    return list;
  };

  const computeFallbackPayments = (curr: PaymentStatus): PaymentStatus[] => {
    if (curr === "PENDING") return ["PAID", "FAILED"];
    if (curr === "PAID") return ["REFUNDED"];
    if (curr === "FAILED") return ["PAID"];
    return [];
  };

  const nextStatuses = hasPermission("orders.status")
    ? (o.allowedNextStatuses?.length ? o.allowedNextStatuses : computeFallbackStatuses(o.orderStatus))
    : [];
  const nextPayments = hasPermission("orders.paymentStatus")
    ? (o.allowedNextPaymentStatuses?.length ? o.allowedNextPaymentStatuses : computeFallbackPayments(o.paymentStatus))
    : [];
  const canUpdateOrder = hasPermission("orders.update");
  const cancelled = o.orderStatus === "CANCELLED";
  const flowIndex = ORDER_STATUS_FLOW.indexOf(o.orderStatus);
  const ship = o.shippingInformation;
  const card = "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link href={`${BASE}/orders`} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900">{o.orderNumber}</h1>
            <p className="text-xs text-slate-500">Placed {formatDateTime(o.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canInvoice && (
            <button
              onClick={openInvoice}
              disabled={busy}
              className="mr-1 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" /> Invoice
            </button>
          )}
          {canDelete && (
            <button
              onClick={deleteOrder}
              disabled={busy}
              title="Delete Order"
              className="mr-1 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash className="h-4 w-4" /> Delete
            </button>
          )}
          {o.fulfillmentMethod === "STORE_PICKUP" && (
            <span className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
              Store Pickup
            </span>
          )}
          {o.isPreOrder && (
            <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              <CalendarClock className="h-3.5 w-3.5" /> Pre-Order
            </span>
          )}
          <StatusPill value={o.orderStatus} />
          <StatusPill value={o.paymentStatus} />
        </div>
      </div>

      {/* Progress */}
      {!cancelled && (
        <div className={`${card} flex flex-wrap items-center gap-2`}>
          {ORDER_STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${i <= flowIndex ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                {s.replace(/_/g, " ")}
              </span>
              {i < ORDER_STATUS_FLOW.length - 1 && <span className={`h-0.5 w-6 ${i < flowIndex ? "bg-emerald-500" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>
      )}
      {/* When each step happened (fields are null until that step is reached) */}
      <div className={`${card} flex flex-wrap gap-x-6 gap-y-2 text-xs`}>
        {(
          [
            ["Placed", o.createdAt],
            ["Confirmed", o.confirmedAt],
            ["Ready to ship", o.readyToShipAt],
            ["Shipped", o.shippedAt],
            ["Out for delivery", o.outForDeliveryAt],
            ["Delivered", o.deliveredAt],
            ["Cancelled", o.cancelledAt],
            ["Paid", o.paidAt],
            ["Refunded", o.refundedAt],
          ] as const
        )
          .filter(([, at]) => at)
          .map(([label, at]) => (
            <div key={label}>
              <span className="font-bold text-slate-500 uppercase">{label}</span>{" "}
              <span className="font-semibold text-slate-800">{formatDateTime(at)}</span>
            </div>
          ))}
      </div>
      {cancelled && o.cancelledAt && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          Cancelled on {formatDateTime(o.cancelledAt)}
          {o.cancellationReason && <p className="mt-1 font-medium text-rose-600">Reason: {o.cancellationReason}</p>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className={card}>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Package className="h-4 w-4 text-slate-400" /> Items ({o.itemCount})
            </h2>
            <ul className="divide-y divide-slate-100">
              {o.items.map((it) => (
                <li key={it._id} className="flex items-center gap-3 py-3">
                  <ProductThumb src={it.thumbnailSnapshot} alt={it.productTitleSnapshot} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate text-sm font-bold text-slate-900">
                      <span className="truncate">{it.productTitleSnapshot}</span>
                      {it.isPreOrder && <StatusPill value="PRE_ORDER" />}
                    </div>
                    <div className="text-xs text-slate-500">
                      {[it.selectedSize && `Size ${it.selectedSize}`, it.selectedUnit].filter(Boolean).join(" · ") || "—"} · {formatBDT(it.unitPrice)} × {it.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">{formatBDT(it.subtotal)}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
              <Row label="Products" value={formatBDT(o.subtotal)} />
              {o.discount > 0 && <Row label={o.couponCode ? `Discount (coupon ${o.couponCode})` : "Discount"} value={`− ${formatBDT(o.discount)}`} />}
              {(o.adminDiscountAmount ?? 0) > 0 && (
                <Row
                  label={`Admin discount${
                    o.adminDiscountType === "PERCENTAGE" ? ` (${o.adminDiscountValue ?? 0}%)` : o.adminDiscountType === "FIXED" ? ` (${formatBDT(o.adminDiscountValue ?? 0)})` : ""
                  }`}
                  value={`− ${formatBDT(o.adminDiscountAmount ?? 0)}`}
                />
              )}
              <Row
                label={o.fulfillmentMethod === "STORE_PICKUP" ? "Delivery (Buy from Store)" : "Delivery charge"}
                value={o.shippingCost === 0 ? "Free" : formatBDT(o.shippingCost)}
              />
              <Row label="Total" value={formatBDT(o.totalAmount)} strong />
              {o.paymentStatus === "REFUNDED" && (
                <>
                  <Row label="Refunded (product price)" value={`− ${formatBDT(o.refundAmount || o.subtotal - o.discount)}`} />
                  <Row label="Kept: delivery charge (shipping company)" value={formatBDT(o.shippingCost)} />
                </>
              )}
            </dl>
          </section>

          {o.isPreOrder && <PreOrderCard order={o} canEdit={canUpdateOrder} onSaved={order.reload} />}

          <AdminNotesCard order={o} canAdd={canUpdateOrder} onSaved={order.reload} />
        </div>

        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="mb-3 text-sm font-extrabold text-slate-900">Order status</h2>
            {nextStatuses.length ? (
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => changeStatus(s)}
                    className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${s === "CANCELLED" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {s === "CANCELLED" ? "Cancel order" : `Mark ${s.replace(/_/g, " ").toLowerCase()}`}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">{hasPermission("orders.status") ? "No further status changes are possible." : "Your role cannot change order status."}</p>
            )}
          </section>

          <section className={card}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <CreditCard className="h-4 w-4 text-slate-400" /> Payment
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              {PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod} · <StatusPill value={o.paymentStatus} />
            </p>
            {nextPayments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextPayments.map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => changePayment(s)}
                    className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Mark {s.toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={card}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <UserRound className="h-4 w-4 text-slate-400" /> Customer
            </h2>
            <div className="text-sm font-bold text-slate-900">{ship.name}</div>
            <div className="text-xs text-slate-500">{ship.phone}</div>
            {ship.email && <div className="text-xs text-slate-500">{ship.email}</div>}
            {o.customer && (
              <p className="mt-2 text-[11px] text-slate-400">
                Account: {o.customer.fullName} ({o.customer.email})
              </p>
            )}
          </section>

          <section className={card}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <MapPin className="h-4 w-4 text-slate-400" /> Shipping address
            </h2>
            <p className="text-sm text-slate-700">{ship.address}</p>
            <p className="text-xs text-slate-500">
              {ship.area}, {ship.city}
            </p>
            {ship.orderNotes && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Note: {ship.orderNotes}</p>}
          </section>
        </div>
      </div>

      <CancelOrderModal
        open={cancelOpen}
        order={o}
        busy={busy}
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          const ok = await run(() => setStatus(o._id, "CANCELLED", reason));
          if (ok) setCancelOpen(false);
        }}
      />
    </div>
  );
}

function CancelOrderModal({
  open,
  order,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  order: AdminOrder;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <form
        className="flex flex-col gap-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(reason);
        }}
      >
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Cancel order {order.orderNumber}?</h2>
          <p className="mt-1 text-xs text-slate-500">
            The order stays in history (nothing is deleted). Stock is restored only for non-pre-order items. This cannot be undone.
          </p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Cancellation reason (optional)</span>
          <textarea
            className={inputClass}
            rows={3}
            maxLength={MAX_REASON}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Supplier delay"
            autoFocus
          />
          <span className="text-right text-[11px] text-slate-400">
            {reason.length}/{MAX_REASON}
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Keep order
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            Yes, cancel order
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** yyyy-mm-dd for <input type="date"> */
const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

function PreOrderCard({ order, canEdit, onSaved }: { order: AdminOrder; canEdit: boolean; onSaved: () => unknown }) {
  const { setPreOrder } = useOrderMutations();
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"days" | "date">("days");
  const [days, setDays] = useState(String(order.preOrderMinDays || PRE_ORDER_MIN_DAYS));
  const [date, setDate] = useState(toDateInput(order.expectedDeliveryDate));
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const daysNum = Number(days);
  // Live preview of the re-based date (createdAt + days), matching what the backend computes
  const rebased = Number.isInteger(daysNum) ? new Date(new Date(order.createdAt).getTime() + daysNum * 86_400_000).toISOString() : null;
  const closed = order.orderStatus === "CANCELLED" || order.orderStatus === "DELIVERED";

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
    if (res) {
      setEditing(false);
      onSaved();
    }
  };

  return (
    <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-violet-900">
          <CalendarClock className="h-4 w-4 text-violet-500" /> Pre-order delivery window
        </h2>
        {canEdit && !closed && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-violet-100 bg-white p-4">
          <div className="text-[11px] font-bold tracking-wider text-violet-500 uppercase">Fulfilment window</div>
          <div className="mt-1 text-2xl font-extrabold text-violet-900">{order.preOrderMinDays ?? 0} days</div>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-white p-4">
          <div className="text-[11px] font-bold tracking-wider text-violet-500 uppercase">Expected delivery</div>
          <div className="mt-1 text-2xl font-extrabold text-violet-900">{formatDate(order.expectedDeliveryDate)}</div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-violet-700/70">This order keeps its own snapshot — editing the product later never changes these values.</p>

      {editing && (
        <form onSubmit={save} className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-white p-4">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {([
              ["days", "Change window (days)"],
              ["date", "Set exact date"],
            ] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => (setMode(m), setError(undefined))}
                className={`flex-1 cursor-pointer rounded-lg py-1.5 ${mode === m ? "bg-white shadow" : "text-slate-500"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === "days" ? (
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>
                Days ({PRE_ORDER_MIN_DAYS}–{PRE_ORDER_MAX_DAYS}) · counted from order date
              </span>
              <input type="number" min={PRE_ORDER_MIN_DAYS} max={PRE_ORDER_MAX_DAYS} step={1} className={inputClass} value={days} onChange={(e) => setDays(e.target.value)} />
              {rebased && <span className="text-[11px] text-slate-500">New expected date: {formatDate(rebased)}</span>}
            </label>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Expected delivery date (must be in the future)</span>
              <input type="date" min={toDateInput(new Date(Date.now() + 86_400_000).toISOString())} className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          )}
          <FieldError message={error} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              Cancel
            </button>
            <PrimaryButton type="submit" loading={saving}>
              Save
            </PrimaryButton>
          </div>
        </form>
      )}
    </section>
  );
}

function AdminNotesCard({ order, canAdd, onSaved }: { order: AdminOrder; canAdd: boolean; onSaved: () => unknown }) {
  const { addNote } = useOrderMutations();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const notes = [...(order.adminNotes ?? [])].reverse();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = note.trim();
    if (!text) return;
    setSaving(true);
    const res = await addNote(order._id, text);
    setSaving(false);
    if (res) {
      setNote("");
      onSaved();
    }
  };

  const authorName = (by: NonNullable<AdminOrder["adminNotes"]>[number]["addedBy"]) =>
    !by ? "Unknown" : typeof by === "string" ? `Admin · ${by.slice(-6)}` : by.fullName || by.email || `Admin · ${by._id.slice(-6)}`;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-extrabold text-slate-900">
        <NotebookPen className="h-4 w-4 text-slate-400" /> Internal notes
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">Staff only</span>
      </h2>
      <p className="mb-4 text-[11px] text-slate-400">Append-only audit trail. Customers never see these notes.</p>

      {canAdd && (
        <form onSubmit={submit} className="mb-4 flex flex-col gap-2">
          <textarea
            className={inputClass}
            rows={2}
            maxLength={MAX_NOTE}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Supplier confirmed stock arriving next week."
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {note.length}/{MAX_NOTE}
            </span>
            <PrimaryButton type="submit" loading={saving} disabled={!note.trim()} className="h-9 px-4 text-xs">
              Add note
            </PrimaryButton>
          </div>
        </form>
      )}

      {notes.length ? (
        <ol className="relative space-y-3 border-l-2 border-slate-100 pl-4">
          {notes.map((n, i) => (
            <li key={n._id ?? `${n.addedAt}-${i}`} className="relative">
              <span className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600" />
              <p className="text-sm whitespace-pre-wrap text-slate-800">{n.note}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {authorName(n.addedBy)} · {formatDateTime(n.addedAt)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-slate-400">No internal notes yet.</p>
      )}
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-extrabold text-slate-900" : "text-slate-600"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// Cancelled orders cannot get an invoice
const cancelledOrder = (o: AdminOrder) => o.orderStatus === "CANCELLED";
