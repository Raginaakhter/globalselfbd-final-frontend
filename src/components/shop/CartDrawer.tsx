"use client";

import React from "react";
import Link from "next/link";
import { X, ShoppingBag, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { lineHref, useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/shop";
import QuantityStepper from "./QuantityStepper";
import ProductImage from "./ProductImage";
import CartLineIssue from "./CartLineIssue";

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, subtotal, count, setQty, removeItem, loading, source } = useCart();

  return (
    <div className={`fixed inset-0 z-[100] ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <div
        onClick={closeDrawer}
        className={`absolute inset-0 bg-navy-900/55 backdrop-blur-[2px] transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
          <h2 className="flex items-center gap-2.5 text-lg font-black text-navy-700">
            <ShoppingBag className="w-5 h-5 text-brand-600" /> Your Cart
            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold">{count}</span>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </h2>
          <button onClick={closeDrawer} aria-label="Close cart" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center text-5xl mb-4 animate-float">🛒</div>
            <h3 className="text-lg font-black text-navy-700">Your cart is empty</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">আপনার কার্ট এখন খালি। পছন্দের পণ্য যোগ করুন!</p>
            <Link href="/shop" onClick={closeDrawer} className="px-6 py-3 rounded-full text-sm font-bold text-white btn-primary-gradient">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 px-5">
              {lines.map((l) => (
                <li key={l.key} className={`py-4 flex gap-3.5 ${l.isAvailable ? "" : "opacity-70"}`}>
                  <Link href={lineHref(l)} onClick={closeDrawer} className="w-20 h-20 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                    <ProductImage image={l.thumbnail} alt={l.title} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={lineHref(l)} onClick={closeDrawer} className="text-sm font-bold text-navy-700 leading-snug line-clamp-2 hover:text-brand-700">
                        {l.title}
                      </Link>
                      <button onClick={() => removeItem(l.key)} aria-label={`Remove ${l.title}`} className="text-slate-400 hover:text-coral-500 p-1 -mr-1 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {l.type === "combo" && <span className="mr-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-black text-indigo-700">COMBO</span>}
                      {l.size ? `Size ${l.size} · ` : ""}
                      {formatPrice(l.unitPrice)} each
                    </p>
                    {l.type === "combo" && !!l.comboItems?.length && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{l.comboItems.map((m) => `${m.quantity}× ${m.productTitle}`).join(" + ")}</p>
                    )}
                    <CartLineIssue line={l} />
                    <div className="mt-2.5 flex items-center justify-between">
                      <QuantityStepper size="sm" value={l.quantity} onChange={(n) => setQty(l.key, n)} />
                      <p className="text-base font-black text-brand-700">{formatPrice(l.subtotal)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="px-5 pt-4 pb-5 border-t border-slate-200 bg-white shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Subtotal</span>
                <span className="text-xl font-black text-navy-700">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Delivery charge calculated at checkout.{source === "local" && " You can check out as a guest — no account needed."}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link href="/cart" onClick={closeDrawer} className="py-3 rounded-full text-sm font-bold text-center text-navy-700 border-2 border-navy-700 hover:bg-navy-50 transition-colors">
                  View Cart
                </Link>
                <Link href="/checkout" onClick={closeDrawer} className="py-3 rounded-full text-sm font-bold text-center text-white btn-primary-gradient flex items-center justify-center gap-1.5">
                  Checkout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
