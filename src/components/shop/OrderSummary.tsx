import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/shop";
import ProductImage from "./ProductImage";

export type SummaryLine = {
  key: string;
  title: string;
  thumbnail: string;
  quantity: number;
  subtotal: number;
  size?: string | null;
  slug?: string;
  type?: "product" | "combo";
};

type Props = {
  lines: SummaryLine[];
  subtotal: number;
  shipping?: number; // undefined => "calculated at checkout"
  discount?: number;
  /** Admin-only extra discount shown as its own row when > 0. */
  adminDiscount?: number;
  /** When set, renders a label above the Delivery row (e.g. "Buy from Store"). */
  fulfillmentLabel?: string;
  /** Total from the backend; falls back to subtotal + shipping - discount - adminDiscount. */
  total?: number;
  children?: React.ReactNode;
  showItems?: boolean;
};

export default function OrderSummary({ lines, subtotal, shipping, discount = 0, adminDiscount = 0, fulfillmentLabel, total, children, showItems = true }: Props) {
  const grandTotal = total ?? Math.max(0, subtotal + (shipping ?? 0) - discount - adminDiscount);

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-black text-navy-700 mb-4">Order Summary</h2>

      {showItems && (
        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-3">
              <Link href={l.slug ? `/${l.type === "combo" ? "combo" : "product"}/${l.slug}` : "#"} className="relative w-14 h-14 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center">
                <ProductImage image={l.thumbnail} alt={l.title} className="rounded-xl" />
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-navy-700 text-white text-[11px] font-bold flex items-center justify-center">{l.quantity}</span>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy-700 line-clamp-1">{l.title}</p>
                {l.size && <p className="text-xs text-slate-500">Size {l.size}</p>}
              </div>
              <p className="text-sm font-black text-navy-700">{formatPrice(l.subtotal)}</p>
            </li>
          ))}
        </ul>
      )}

      <dl className="space-y-2.5 text-sm border-t border-slate-100 pt-4">
        <div className="flex justify-between">
          <dt className="text-slate-600">Subtotal</dt>
          <dd className="font-bold text-navy-700">{formatPrice(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-slate-600">Discount</dt>
            <dd className="font-bold text-brand-700">− {formatPrice(discount)}</dd>
          </div>
        )}
        {adminDiscount > 0 && (
          <div className="flex justify-between">
            <dt className="text-slate-600">Admin discount</dt>
            <dd className="font-bold text-indigo-700">− {formatPrice(adminDiscount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-slate-600">{fulfillmentLabel ? `Delivery (${fulfillmentLabel})` : "Delivery"}</dt>
          <dd className="font-bold text-navy-700">
            {shipping === undefined ? (
              <span className="text-slate-500 font-medium">At checkout</span>
            ) : shipping === 0 ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              formatPrice(shipping)
            )}
          </dd>
        </div>
        <div className="flex justify-between items-baseline border-t border-slate-100 pt-3">
          <dt className="font-black text-navy-700">Total</dt>
          <dd className="text-2xl font-black text-brand-700">{formatPrice(grandTotal)}</dd>
        </div>
      </dl>

      {children}
    </div>
  );
}
