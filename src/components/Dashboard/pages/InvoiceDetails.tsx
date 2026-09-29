"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";
import type { Invoice } from "@/lib/backend-types";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import { BASE } from "../AppSidebar";
import { useApiQuery } from "../api";
import { ErrorBox, Spinner } from "../ui";

/** One invoice, laid out for screen and print. `autoPrint` opens the print dialog once it has loaded. */
export default function InvoiceDetails({ invoiceId, autoPrint }: { invoiceId: string; autoPrint?: boolean }) {
  const invoice = useApiQuery<Invoice>(`/invoices/${encodeURIComponent(invoiceId)}`);
  const printed = useRef(false);

  useEffect(() => {
    if (!autoPrint || !invoice.data || printed.current) return;
    printed.current = true;
    // Let the page paint before the print dialog takes over
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, [autoPrint, invoice.data]);

  if (invoice.error) return <ErrorBox message={invoice.error} onRetry={invoice.reload} />;
  if (!invoice.data) return <Spinner label="Loading invoice..." />;
  const inv = invoice.data;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={`${BASE}/invoices`} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <div className="flex gap-2">
          <Link
            href={`${BASE}/orders/${inv.orderId}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 px-4 text-sm font-bold text-blue-600 hover:bg-blue-50"
          >
            <ExternalLink className="h-4 w-4" /> Open Order
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      <InvoiceDocument invoice={inv} className="print-area" />
    </div>
  );
}
