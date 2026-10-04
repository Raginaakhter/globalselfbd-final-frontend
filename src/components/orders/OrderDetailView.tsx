"use client";

import React from "react";
import { CalendarClock, MapPin, Phone, User } from "lucide-react";
import { formatPrice } from "@/lib/shop";
import { PAYMENT_METHOD_LABELS, type Order } from "@/lib/backend-types";
import ProductImage from "@/components/shop/ProductImage";
import StatusTimeline, { PreOrderBadge, PreOrderNotice } from "./StatusTimeline";

/** Full order card (customer, items, totals, delivery, status) for a backend order. */
export default function OrderDetailView({ order, children }: { order: Order; children?: React.ReactNode }) {
  const ship = order.shippingInformation;
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <p className="text-sm font-bold text-slate-500 flex items-center gap-2 flex-wrap">
            Order <span className="text-blue-950 font-black tracking-wide">{order.orderNumber}</span>
            {order.isPreOrder && <PreOrderBadge />}
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        {order.isPreOrder && order.orderStatus !== "CANCELLED" && order.orderStatus !== "DELIVERED" && (
          <PreOrderNotice minDays={order.preOrderMinDays} expectedDeliveryDate={order.expectedDeliveryDate} className="mb-6" />
        )}
        <StatusTimeline
          status={order.orderStatus}
          cancellationReason={order.cancellationReason}
          timestamps={{
            PENDING: order.createdAt,
            CONFIRMED: order.confirmedAt,
            READY_TO_SHIP: order.readyToShipAt,
            SHIPPED: order.shippedAt,
            OUT_FOR_DELIVERY: order.outForDeliveryAt,
            DELIVERED: order.deliveredAt,
            CANCELLED: order.cancelledAt,
          }}
        />
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <p className="flex items-start gap-2 text-slate-600">
            <User className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
            <span>
              <span className="font-bold text-blue-950">{ship.name}</span>
              {ship.email && (
                <>
                  <br />
                  {ship.email}
                </>
              )}
            </span>
          </p>
          <p className="flex items-start gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
            <span>{ship.phone}</span>
          </p>
          <p className="flex items-start gap-2 text-slate-600 sm:col-span-2">
            <MapPin className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
            <span>
              {ship.address}, {ship.area}, {ship.city}
              {ship.orderNotes && (
                <>
                  <br />
                  <span className="text-xs text-slate-400">Note: {ship.orderNotes}</span>
                </>
              )}
            </span>
          </p>
        </div>

        <ul className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
          {order.items.map((it) => (
            <li key={it._id} className="py-3 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                <ProductImage image={it.thumbnailSnapshot} alt={it.productTitleSnapshot} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-950 line-clamp-1">{it.productTitleSnapshot}</p>
                {it.isPreOrder && <PreOrderBadge className="mt-0.5" />}
                <p className="text-xs text-slate-500">
                  {it.selectedSize ? `Size ${it.selectedSize} · ` : ""}
                  {formatPrice(it.unitPrice)} × {it.quantity}
                </p>
              </div>
              <p className="text-sm font-black text-blue-950">{formatPrice(it.subtotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="pt-2 border-t border-slate-100 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Subtotal</dt>
            <dd className="font-bold">{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-600">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
              <dd className="font-bold">− {formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-600">Delivery</dt>
            <dd className="font-bold">{formatPrice(order.shippingCost)}</dd>
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <dt className="font-black text-blue-950">
              Total ({PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod} · {order.paymentStatus.toLowerCase()})
            </dt>
            <dd className="text-xl font-black text-blue-900">{formatPrice(order.totalAmount)}</dd>
          </div>
          {order.paymentStatus === "REFUNDED" && (
            <div className="flex justify-between rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
              <dt className="font-semibold">Refunded (product price; delivery charge is not refundable)</dt>
              <dd className="font-black">{formatPrice(order.refundAmount || order.subtotal - order.discount)}</dd>
            </div>
          )}
        </dl>

        {children}
      </div>
    </div>
  );
}
