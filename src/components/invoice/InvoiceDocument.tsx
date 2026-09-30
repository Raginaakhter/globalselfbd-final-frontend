"use client";
import { LOGO_URL } from "@/lib/brand";

import { useSite } from "@/context/SiteContext";
import { PAYMENT_METHOD_LABELS, type Invoice } from "@/lib/backend-types";
import { formatPrice } from "@/lib/shop";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-";

const PILL: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

function Pill({ value }: { value: string }) {
  return <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide ${PILL[value] ?? "bg-blue-50 text-blue-700 border-blue-200"}`}>{value}</span>;
}

/** The invoice itself (no page chrome), shared by the admin dashboard and the customer's order page. */
export default function InvoiceDocument({ invoice: inv, className = "" }: { invoice: Invoice; className?: string }) {
  const { settings } = useSite();
  // The backend seller block can be empty; fall back to the site's own contact details
  const seller = {
    name: inv.seller.name || settings.siteName,
    logoUrl: inv.seller.logoUrl || LOGO_URL,
    phone: inv.seller.phone || settings.phone,
    email: inv.seller.email || settings.email,
    address: inv.seller.address || settings.address,
  };
  const refunded = inv.refundAmount > 0;

  return (
    <article className={`mx-auto w-full max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none ${className}`}>
      <header className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={seller.logoUrl} alt={seller.name} className="h-12 w-auto object-contain" />
          <div className="mt-3 space-y-0.5 text-xs text-slate-500">
            <p className="text-sm font-bold text-slate-900">{seller.name}</p>
            {seller.address && <p>{seller.address}</p>}
            {seller.phone && <p>Phone: {seller.phone}</p>}
            {seller.email && <p>Email: {seller.email}</p>}
          </div>
        </div>
        <div className="sm:text-right">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">INVOICE</h1>
          <p className="mt-1 font-mono text-sm font-bold text-blue-700">{inv.invoiceNumber}</p>
          <dl className="mt-3 space-y-0.5 text-xs text-slate-500">
            <div>
              <dt className="inline font-semibold">Date: </dt>
              <dd className="inline">{formatDate(inv.issuedAt)}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Order: </dt>
              <dd className="inline font-mono">{inv.orderNumber}</dd>
            </div>
          </dl>
          <div className="mt-3 flex gap-2 sm:justify-end">
            <Pill value={inv.paymentStatus} />
            <Pill value={inv.orderStatus} />
          </div>
        </div>
      </header>

      <section className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Bill to</h2>
          <p className="font-bold text-slate-900">{inv.customerName}</p>
          <p className="text-sm text-slate-600">{inv.customerPhone}</p>
          {inv.customerEmail && <p className="text-sm text-slate-600">{inv.customerEmail}</p>}
        </div>
        <div>
          <h2 className="mb-2 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Ship to</h2>
          <p className="text-sm text-slate-700">{inv.shippingAddress}</p>
          <p className="text-sm text-slate-600">{[inv.shippingArea, inv.shippingCity].filter(Boolean).join(", ")}</p>
          <p className="mt-2 text-xs text-slate-500">
            Payment: <span className="font-semibold text-slate-700">{PAYMENT_METHOD_LABELS[inv.paymentMethod] ?? inv.paymentMethod}</span>
            {inv.paidAt && <> · Paid {formatDate(inv.paidAt)}</>}
          </p>
        </div>
      </section>

      <div className="overflow-x-auto py-6">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4 text-right">Unit price</th>
              <th className="py-2 pr-4 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inv.items.map((it, i) => (
              <tr key={`${it.productId}-${i}`}>
                <td className="py-3 pr-4 text-slate-400">{i + 1}</td>
                <td className="py-3 pr-4">
                  <p className="font-semibold text-slate-900">{it.productTitle}</p>
                  {(it.selectedSize || it.selectedUnit) && (
                    <p className="text-xs text-slate-500">{[it.selectedSize && `Size ${it.selectedSize}`, it.selectedUnit].filter(Boolean).join(" · ")}</p>
                  )}
                </td>
                <td className="py-3 pr-4 text-right whitespace-nowrap text-slate-600">{formatPrice(it.unitPrice)}</td>
                <td className="py-3 pr-4 text-right text-slate-600">{it.quantity}</td>
                <td className="py-3 text-right font-semibold whitespace-nowrap text-slate-900">{formatPrice(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto w-full max-w-xs space-y-2 border-t border-slate-200 pt-4 text-sm">
        <Row label="Subtotal" value={formatPrice(inv.subtotal)} />
        {inv.discount > 0 && <Row label={inv.couponCode ? `Discount (${inv.couponCode})` : "Discount"} value={`− ${formatPrice(inv.discount)}`} />}
        <Row label="Delivery charge" value={formatPrice(inv.shippingCost)} />
        <Row label="Grand total" value={formatPrice(inv.totalAmount)} strong />
        {refunded && (
          <>
            <Row label="Refunded (product price)" value={`− ${formatPrice(inv.refundAmount)}`} tone="text-rose-600" />
            <Row label="Net amount" value={formatPrice(inv.netAmount)} strong />
          </>
        )}
      </dl>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
        <p>Thank you for shopping with {seller.name}.</p>
        {refunded && <p className="mt-1">Refunds give back the product price only; the delivery charge is not refundable.</p>}
      </footer>
    </article>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-slate-100 pt-2 text-base font-extrabold text-slate-900" : tone ?? "text-slate-600"}`}>
      <dt>{label}</dt>
      <dd className="whitespace-nowrap">{value}</dd>
    </div>
  );
}
