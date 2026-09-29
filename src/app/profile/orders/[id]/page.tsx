"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError, useAuth } from "@/context/AuthContext";
import AccountHeader from "@/components/account/AccountHeader";
import OrderDetailView from "@/components/orders/OrderDetailView";
import type { Order } from "@/lib/backend-types";
import { CUSTOMER_CANCELLABLE } from "@/lib/order-status";
import { ArrowLeft, FileText, Loader2, PackageX, XCircle } from "lucide-react";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, loading: authLoading, hasPermission } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // The backend only returns the order when it belongs to the signed-in customer.
      const res = await api<Order>(`/orders/${encodeURIComponent(id)}`);
      setOrder(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this order.");
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (!authLoading) queueMicrotask(load);
  }, [authLoading, load]);

  const cancel = async () => {
    if (!order || !confirm(`Cancel order ${order.orderNumber}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      const res = await api<Order>(`/orders/${order._id}/cancel`, { method: "PATCH" });
      setOrder(res.data);
      toast.success(res.message || "Order cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel the order.");
    } finally {
      setCancelling(false);
    }
  };

  // The backend sends canCancel; older responses fall back to the known cancellable statuses
  const canCancel = order && (order.canCancel ?? CUSTOMER_CANCELLABLE.includes(order.orderStatus)) && hasPermission("orders.create");
  // Invoices exist once the order is confirmed, and never for cancelled orders
  const hasInvoice = order && order.orderStatus !== "PENDING" && order.orderStatus !== "CANCELLED";

  return (
    <div className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col">
      <AccountHeader title="Order Details" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <Link href="/profile?tab=orders" className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-700 hover:text-cyan-800 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>

        {(loading || authLoading) && !order && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">{error}</p>
            <Link href="/profile?tab=orders" className="inline-block mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient">
              Back to My Orders
            </Link>
          </div>
        )}

        {order && (
          <OrderDetailView order={order}>
            {hasInvoice && (
              <Link
                href={`/profile/orders/${order._id}/invoice`}
                className="w-full py-3 rounded-full border-2 border-cyan-200 text-sm font-bold text-cyan-700 hover:bg-cyan-50 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> View invoice
              </Link>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={cancel}
                disabled={cancelling}
                className="w-full py-3 rounded-full border-2 border-rose-200 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancel order
              </button>
            )}
          </OrderDetailView>
        )}
      </main>
    </div>
  );
}
