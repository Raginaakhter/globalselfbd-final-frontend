"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Package, Phone, Search } from "lucide-react";
import { formatPrice } from "@/lib/shop";
import type { TrackedOrder } from "@/lib/backend-types";
import StatusTimeline, { PreOrderBadge, PreOrderNotice, StatusBadge } from "@/components/orders/StatusTimeline";
import ProductImage from "@/components/shop/ProductImage";

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

/** Public order tracking — no account needed. Phone number + order number must match. */
export default function TrackOrderPage() {
  const search = useSearchParams();
  const prefillNum = (search?.get("orderNumber") ?? "").trim().toUpperCase();
  const prefillPhone = (search?.get("phone") ?? "").replace(/[\s-]/g, "");

  const [phoneNumber, setPhoneNumber] = useState(prefillPhone);
  const [orderNumber, setOrderNumber] = useState(prefillNum);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [justPlaced, setJustPlaced] = useState(Boolean(prefillNum && prefillPhone));

  const lookup = useCallback(async (num: string, phone: string) => {
    if (!BD_PHONE.test(phone)) {
      setError("Enter the phone number used on the order (e.g. 01712345678).");
      return;
    }
    if (!num) {
      setError("Please enter your order number (e.g. ORD-1001).");
      return;
    }
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/public/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, orderNumber: num }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        setError(body?.message || (res.status === 404 ? "No order matches that phone + order number." : "Could not look up the order."));
      } else {
        setOrder(body.data as TrackedOrder);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-run the lookup when the page is opened with prefill (e.g. right after guest checkout).
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    if (!prefillNum || !prefillPhone) return;
    autoRan.current = true;
    void lookup(prefillNum, prefillPhone);
  }, [prefillNum, prefillPhone, lookup]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setJustPlaced(false);
    void lookup(orderNumber.trim().toUpperCase(), phoneNumber.replace(/[\s-]/g, ""));
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <span className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
          <Package className="w-7 h-7" />
        </span>
        <h1 className="text-3xl font-black text-navy-700 tracking-tight">
          {justPlaced ? "Order placed!" : "Track Your Order"}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {justPlaced
            ? `Thanks! Your order ${prefillNum} is confirmed. Save this number — you can look it up any time with your phone number.`
            : "Enter the phone number used on your order along with the order number."}
        </p>
      </div>

      <form onSubmit={submit} className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <label className="block">
          <span className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">Phone number</span>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="01712345678"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15"
            />
          </div>
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">Order number</span>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ORD-1001"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15"
          />
        </label>
        {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-full text-sm font-black text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Track order
        </button>
        <p className="text-center text-xs text-slate-500">
          Have an account?{" "}
          <Link href="/profile?tab=orders" className="font-bold text-brand-700 hover:underline">
            See all your orders
          </Link>
          .
        </p>
      </form>

      {order && (
        <div className="mt-8 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-slate-500">Order</p>
              <p className="font-mono text-lg font-black text-navy-700 flex items-center gap-2">
                {order.orderNumber}
                {order.isPreOrder && <PreOrderBadge />}
              </p>
            </div>
            <StatusBadge status={order.orderStatus} />
          </div>

          {order.isPreOrder && order.orderStatus !== "CANCELLED" && order.orderStatus !== "DELIVERED" && (
            <PreOrderNotice minDays={order.preOrderMinDays} expectedDeliveryDate={order.expectedDeliveryDate} />
          )}

          <StatusTimeline
            status={order.orderStatus}
            cancellationReason={order.cancellationReason}
            timestamps={{
              PENDING: order.timeline?.placedAt,
              CONFIRMED: order.timeline?.confirmedAt,
              READY_TO_SHIP: order.timeline?.readyToShipAt,
              SHIPPED: order.timeline?.shippedAt,
              OUT_FOR_DELIVERY: order.timeline?.outForDeliveryAt,
              DELIVERED: order.timeline?.deliveredAt,
              CANCELLED: order.timeline?.cancelledAt,
            }}
          />

          {!!order.items?.length && (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {order.items.map((it, i) => (
                <li key={`${it.productTitle}-${i}`} className="py-3 flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                    <ProductImage image={it.thumbnail} alt={it.productTitle} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy-700 line-clamp-1">{it.productTitle}</p>
                    {it.isPreOrder && <PreOrderBadge className="mt-0.5" />}
                    <p className="text-xs text-slate-500">
                      {formatPrice(it.unitPrice)} × {it.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-black text-navy-700">{formatPrice(it.subtotal)}</p>
                </li>
              ))}
            </ul>
          )}

          <dl className="space-y-1.5 text-sm">
            {!order.items?.length && order.itemCount != null && (
              <div className="flex justify-between"><dt className="text-slate-600">Items</dt><dd className="font-semibold">{order.itemCount}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="font-semibold">{formatPrice(order.subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-slate-600">{order.fulfillmentMethod === "STORE_PICKUP" ? "Delivery (Buy from Store)" : "Delivery"}</dt>
              <dd className="font-semibold">{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</dd>
            </div>
            <div className="flex justify-between"><dt className="text-slate-600">Payment</dt><dd className="font-semibold">{order.paymentStatus}</dd></div>
            <div className="flex justify-between pt-2 border-t border-slate-100 mt-2"><dt className="font-black text-navy-700">Total</dt><dd className="font-black text-brand-700">{formatPrice(order.totalAmount)}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}
