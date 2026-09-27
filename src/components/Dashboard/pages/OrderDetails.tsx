"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, MapPin, Package, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/lib/backend-types";
import { BASE } from "../AppSidebar";
import { useApiQuery } from "../api";
import { formatBDT } from "../format";
import { ErrorBox, Spinner, StatusPill, useConfirm } from "../ui";
import { ProductThumb } from "./ProductsCatalog";
import { ORDER_STATUSES, PAYMENT_METHOD_LABELS, formatDateTime, useOrderMutations } from "./orderShared";

export default function OrderDetails({ orderId }: { orderId: string }) {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const { setStatus, setPaymentStatus } = useOrderMutations();
  const order = useApiQuery<AdminOrder>(`/admin/orders/${encodeURIComponent(orderId)}`);
  const [busy, setBusy] = useState(false);

  if (order.error) return <ErrorBox message={order.error} onRetry={order.reload} />;
  if (!order.data) return <Spinner label="Loading order..." />;
  const o = order.data;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    // The response has no customer / allowed-next fields, so reload the full detail.
    if (await fn()) await order.reload();
    setBusy(false);
  };

  const changeStatus = async (next: OrderStatus) => {
    if (next === "CANCELLED") {
      const ok = await confirm({ title: "Cancel this order?", text: "Stock for every item is restored. This cannot be undone.", confirmText: "Yes, Cancel Order" });
      if (!ok) return;
    }
    run(() => setStatus(o._id, next));
  };

  const changePayment = async (next: PaymentStatus) => {
    if (next === "REFUNDED") {
      const ok = await confirm({ title: "Mark as refunded?", text: "REFUNDED is final and cannot be changed later.", confirmText: "Yes, Refunded" });
      if (!ok) return;
    }
    run(() => setPaymentStatus(o._id, next));
  };

  const nextStatuses = hasPermission("orders.status") ? (o.allowedNextStatuses ?? []) : [];
  const nextPayments = hasPermission("orders.paymentStatus") ? (o.allowedNextPaymentStatuses ?? []) : [];
  const cancelled = o.orderStatus === "CANCELLED";
  const flowIndex = ORDER_STATUSES.indexOf(o.orderStatus);
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
          <StatusPill value={o.orderStatus} />
          <StatusPill value={o.paymentStatus} />
        </div>
      </div>

      {/* Progress */}
      {!cancelled && (
        <div className={`${card} flex flex-wrap items-center gap-2`}>
          {ORDER_STATUSES.filter((s) => s !== "CANCELLED").map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${i <= flowIndex ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>{s}</span>
              {i < 4 && <span className={`h-0.5 w-6 ${i < flowIndex ? "bg-emerald-500" : "bg-slate-200"}`} />}
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
            ["Shipped", o.shippedAt],
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Cancelled on {formatDateTime(o.cancelledAt)}</div>
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
                    <div className="truncate text-sm font-bold text-slate-900">{it.productTitleSnapshot}</div>
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
              {o.discount > 0 && <Row label="Discount" value={`− ${formatBDT(o.discount)}`} />}
              <Row label="Delivery charge" value={formatBDT(o.shippingCost)} />
              <Row label="Total" value={formatBDT(o.totalAmount)} strong />
            </dl>
          </section>
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
                    {s === "CANCELLED" ? "Cancel order" : `Mark ${s.toLowerCase()}`}
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
    </div>
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
