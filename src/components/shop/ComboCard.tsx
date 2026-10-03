"use client";

import Link from "next/link";
import { useState } from "react";
import { Layers, Loader2, ShoppingCart } from "lucide-react";
import type { Combo } from "@/lib/backend-types";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/shop";
import ProductImage from "./ProductImage";

/** Add-to-cart button for a combo; the backend checks stock on every member product. */
export function AddComboButton({ combo, qty = 1, className = "" }: { combo: Combo; qty?: number; className?: string }) {
  const { addCombo } = useCart();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        setBusy(true);
        await addCombo(combo, qty);
        setBusy(false);
      }}
      className={`flex items-center justify-center gap-1.5 rounded-full text-sm font-bold text-white btn-primary-gradient cursor-pointer disabled:opacity-60 ${className}`}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
      Add to Cart
    </button>
  );
}

export default function ComboCard({ combo }: { combo: Combo }) {
  const href = `/combo/${combo.slug}`;
  const members = combo.itemDetails ?? [];
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="relative aspect-[4/3] bg-slate-50 flex items-center justify-center overflow-hidden">
        <ProductImage image={combo.thumbnail || members[0]?.thumbnail || ""} alt={combo.comboTitle} className="transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
          <Layers className="w-3 h-3" /> Combo
        </span>
        {combo.discountPercent > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-coral-500 px-2.5 py-1 text-[11px] font-black text-white shadow">-{combo.discountPercent}%</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link href={href} className="text-sm sm:text-base font-bold text-navy-700 leading-snug line-clamp-2 hover:text-brand-700">
          {combo.comboTitle}
        </Link>
        {members.length > 0 && (
          <div className="mt-2 flex items-center -space-x-2">
            {members.slice(0, 4).map((m) => (
              <span key={m.productId} title={`${m.quantity}× ${m.productTitle}`} className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-100">
                <ProductImage image={m.thumbnail} alt={m.productTitle} />
              </span>
            ))}
            <span className="pl-3 text-[11px] font-semibold text-slate-500">{members.length} items</span>
          </div>
        )}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-brand-700">{formatPrice(combo.comboPrice)}</span>
            {combo.originalTotal > combo.comboPrice && <span className="text-xs text-slate-400 line-through">{formatPrice(combo.originalTotal)}</span>}
          </div>
          {combo.savings > 0 && <p className="text-[11px] font-bold text-emerald-600">You save {formatPrice(combo.savings)}</p>}
          <AddComboButton combo={combo} className="mt-3 w-full py-2.5" />
        </div>
      </div>
    </article>
  );
}
