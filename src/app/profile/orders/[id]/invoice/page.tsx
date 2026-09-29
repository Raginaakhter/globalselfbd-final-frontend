"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileX, Loader2, Printer } from "lucide-react";
import { ApiError, useAuth } from "@/context/AuthContext";
import AccountHeader from "@/components/account/AccountHeader";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import type { Invoice } from "@/lib/backend-types";

/** Customer's own invoice (available once the order is confirmed). */
export default function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, loading: authLoading } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api<Invoice>(`/orders/${encodeURIComponent(id)}/invoice`);
      setInvoice(res.data);
    } catch (err) {
      // 404 while the order is still pending or after it was cancelled
      setError(err instanceof ApiError && err.status === 404 ? "The invoice is available once your order is confirmed." : err instanceof ApiError ? err.message : "Could not load the invoice.");
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (!authLoading) queueMicrotask(load);
  }, [authLoading, load]);

  return (
    <div className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col print:bg-white">
      <div className="print:hidden">
        <AccountHeader title="Invoice" />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 print:hidden">
          <Link href={`/profile/orders/${encodeURIComponent(id)}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-700 hover:text-cyan-800">
            <ArrowLeft className="w-4 h-4" /> Back to Order
          </Link>
          {invoice && (
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white btn-primary-gradient cursor-pointer">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          )}
        </div>

        {(loading || authLoading) && !invoice && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <FileX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">{error}</p>
          </div>
        )}

        {invoice && <InvoiceDocument invoice={invoice} />}
      </main>
    </div>
  );
}
