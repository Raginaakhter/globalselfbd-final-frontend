"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AccountHeader from "@/components/account/AccountHeader";
import AccountPanel, { AvatarPicker } from "@/components/account/AccountPanel";
import { PreOrderBadge, StatusBadge } from "@/components/orders/StatusTimeline";
import { formatShortDate } from "@/lib/order-status";
import { formatPrice } from "@/lib/shop";
import type { OrderListItem } from "@/lib/backend-types";
import ProductImage from "@/components/shop/ProductImage";
import {
  Loader2,
  Package,
  ChevronRight,
  ShieldCheck,
  Inbox,
  Heart,
  Truck,
} from "lucide-react";
import MyReviews from "@/components/reviews/MyReviews";

function ProfileContent() {
  const { user, isStaff, api, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<"account" | "orders" | "reviews">(initialTab === "orders" || initialTab === "reviews" ? initialTab : "account");

  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // Load "My Orders" — a logged-in user can only ever see their own orders (the API scopes the
  // query to the authenticated user's id, so there is nothing to leak here even if requested).
  const loadOrders = React.useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await api<{ orders: OrderListItem[] }>("/orders?limit=50");
      setOrders(res.data.orders);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Failed to load your orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (tab === "orders" && orders === null && user) queueMicrotask(() => loadOrders());
  }, [tab, orders, user, loadOrders]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col">
      <AccountHeader title="My Account" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
        <div className="text-center">
          <AvatarPicker />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
          {isStaff && (
            <Link
              href="/admin-dashboard"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Go to Admin Dashboard
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm w-fit mx-auto">
          <button
            onClick={() => setTab("account")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "account" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "orders" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "reviews" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            My Reviews
          </button>
          <Link
            href="/wishlist"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Heart className="w-4 h-4" /> Wishlist
          </Link>
          <Link
            href="/track-order"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Truck className="w-4 h-4" /> Track Order
          </Link>
        </div>

        {tab === "account" ? (
          <AccountPanel />
        ) : tab === "reviews" ? (
          <MyReviews />
        ) : (
          <div className="auth-card rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
              <Package className="w-5 h-5 text-cyan-600" />
              <span>My Orders</span>
            </h2>

            {ordersLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            )}

            {!ordersLoading && ordersError && (
              <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {ordersError}
              </p>
            )}

            {!ordersLoading && !ordersError && orders?.length === 0 && (
              <div className="text-center py-10">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">You haven&apos;t placed any orders yet.</p>
                <Link href="/shop" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient">
                  Start Shopping
                </Link>
              </div>
            )}

            {!ordersLoading && orders && orders.length > 0 && (
              <ul className="space-y-3">
                {orders.map((o) => (
                  <li key={o._id}>
                    <Link
                      href={`/profile/orders/${o._id}`}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40 transition-colors"
                    >
                      <span className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                        <ProductImage image={o.firstItem?.thumbnail} alt={o.firstItem?.productTitle ?? o.orderNumber} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                          {o.orderNumber}
                          <StatusBadge status={o.orderStatus} />
                          {o.isPreOrder && <PreOrderBadge />}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {o.firstItem?.productTitle ?? "Order"}
                          {o.itemCount > 1 ? ` + ${o.itemCount - 1} more` : ""} · {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        {o.isPreOrder && o.expectedDeliveryDate && o.orderStatus !== "CANCELLED" && o.orderStatus !== "DELIVERED" && (
                          <p className="text-[11px] font-semibold text-violet-700 mt-0.5">Expected delivery: {formatShortDate(o.expectedDeliveryDate)}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{formatPrice(o.totalAmount)}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-600 animate-spin" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
