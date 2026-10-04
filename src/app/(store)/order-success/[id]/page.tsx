"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Home, MapPin, Package, Phone, ShoppingBag, Wallet, PackageSearch } from "lucide-react";
import { formatPrice } from "@/lib/shop";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/orders/StatusTimeline";
import ProductImage from "@/components/shop/ProductImage";
import { PAYMENT_METHOD_LABELS, type Order } from "@/lib/backend-types";

const CONFETTI = ["#155dfc", "#193cb8", "#fbbf24", "#1e3a6e", "#f43f5e", "#51a2ff", "#f59e0b"];

function Confetti() {
  // Deterministic pseudo-random layout keeps server and client markup identical.
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    left: (i * 97) % 100,
    delay: ((i * 37) % 100) / 100,
    duration: 2.4 + ((i * 53) % 18) / 10,
    color: CONFETTI[i % CONFETTI.length],
    rotate: (i * 47) % 360,
    round: i % 3 === 0,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute -top-4 block w-2.5 h-3.5"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${0.5 + p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function SuccessCheck() {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <span className="absolute inset-0 rounded-full bg-brand-400/30 success-ring" />
      <span className="absolute inset-0 rounded-full bg-brand-400/20 success-ring [animation-delay:0.35s]" />
      <svg viewBox="0 0 120 120" className="relative w-32 h-32 success-pop" role="img" aria-label="Order placed successfully">
        <circle cx="60" cy="60" r="54" fill="#eff6ff" stroke="#193cb8" strokeWidth="6" strokeLinecap="round" className="success-circle" />
        <path d="M36 62 L54 80 L86 42" fill="none" stroke="#193cb8" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="success-tick" />
      </svg>
    </div>
  );
}

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    api<Order>(`/orders/${encodeURIComponent(id)}`)
      .then((res) => !cancelled && setOrder(res.data))
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [api, id, authLoading]);

  const ship = order?.shippingInformation;
  const insideDhaka = ship?.city.trim().toLowerCase() === "dhaka";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
      <Confetti />

      <div className="text-center">
        <SuccessCheck />
        <h1 className="text-3xl sm:text-4xl font-black text-navy-700 tracking-tight mt-6 fade-up" style={{ animationDelay: "0.9s" }}>
          Order placed successfully!
        </h1>
        <p className="text-slate-600 mt-2 fade-up" style={{ animationDelay: "1s" }}>
          ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে।
        </p>
        {order && (
          <>
            <p className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-200 text-sm font-bold text-brand-800 fade-up" style={{ animationDelay: "1.1s" }}>
              <Package className="w-4 h-4" /> Order: <span className="font-black tracking-wider">{order.orderNumber}</span>
            </p>
            <p className="mt-2 fade-up" style={{ animationDelay: "1.15s" }}>
              <StatusBadge status={order.orderStatus} />
            </p>
          </>
        )}
      </div>

      {order && ship && (
        <div className="mt-10 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden fade-up" style={{ animationDelay: "1.25s" }}>
          <div className="grid sm:grid-cols-3 gap-px bg-slate-100 text-sm">
            {[
              { icon: CalendarClock, t: "Estimated delivery", v: insideDhaka ? "1–2 business days" : "2–4 business days" },
              { icon: Wallet, t: "Payment", v: `${PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod} · ${formatPrice(order.totalAmount)}` },
              { icon: Phone, t: "We'll call", v: ship.phone },
            ].map(({ icon: Icon, t, v }) => (
              <div key={t} className="bg-white p-4 flex items-start gap-3">
                <Icon className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">{t}</p>
                  <p className="font-bold text-navy-700">{v}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            <p className="flex items-start gap-2 text-sm text-slate-600 mb-5">
              <MapPin className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <span>
                <span className="font-bold text-navy-700">{ship.name}</span> — {ship.address}, {ship.area}, {ship.city}
              </span>
            </p>
            <ul className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <li key={it._id} className="py-3 flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                    <ProductImage image={it.thumbnailSnapshot} alt={it.productTitleSnapshot} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy-700 line-clamp-1">{it.productTitleSnapshot}</p>
                    <p className="text-xs text-slate-500">
                      {it.selectedSize ? `Size ${it.selectedSize} · ` : ""}× {it.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-black text-navy-700">{formatPrice(it.subtotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="font-bold">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">{order.couponCode ? `Coupon (${order.couponCode})` : "Discount"}</dt>
                  <dd className="font-bold text-brand-700">− {formatPrice(order.discount)}</dd>
                </div>
              )}
              {(order.adminDiscountAmount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Admin discount</dt>
                  <dd className="font-bold text-indigo-700">− {formatPrice(order.adminDiscountAmount ?? 0)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-600">
                  {order.fulfillmentMethod === "STORE_PICKUP" ? "Delivery (Store Pickup)" : "Delivery"}
                </dt>
                <dd className="font-bold">
                  {order.shippingCost === 0 ? <span className="text-emerald-600">Free</span> : formatPrice(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <dt className="font-black text-navy-700">Total to pay</dt>
                <dd className="text-xl font-black text-brand-700">{formatPrice(order.totalAmount)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {loaded && !order && (
        <p className="mt-8 text-center text-sm text-slate-500 fade-up" style={{ animationDelay: "1.25s" }}>
          Your order details couldn&apos;t be loaded, but your order is confirmed. You can find it under My Orders.
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3 fade-up" style={{ animationDelay: "1.4s" }}>
        <Link href={`/profile/orders/${id}`} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white btn-primary-gradient">
          <PackageSearch className="w-4 h-4" /> Track Order
        </Link>
        <Link href="/" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-navy-700 border-2 border-navy-700 hover:bg-navy-50 transition-colors">
          <Home className="w-4 h-4" /> Go to Home
        </Link>
      </div>
      <div className="mt-4 text-center fade-up" style={{ animationDelay: "1.45s" }}>
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800">
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}
