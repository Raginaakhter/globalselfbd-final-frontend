"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Heart, ShoppingCart, Zap } from "lucide-react";
import type { StoreProduct } from "@/lib/storefront";
import { formatPrice } from "@/lib/shop";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import QuantityStepper from "./QuantityStepper";

export default function PurchasePanel({ product }: { product: StoreProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const outOfStock = product.availability === "OUT_OF_STOCK";
  const liked = isWishlisted(product._id);
  const needsSize = product.sizes.length > 0 && !size;

  const add = async (opts?: { openDrawer?: boolean; silent?: boolean }) => {
    setBusy(true);
    const ok = await addItem(product, qty, { size, ...opts });
    setBusy(false);
    return ok;
  };

  const handleAdd = async () => {
    if (await add()) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    }
  };

  // Orders are placed from the cart, so Buy Now adds the item and goes straight to checkout.
  const handleBuyNow = async () => {
    if (await add({ openDrawer: false, silent: true })) router.push("/checkout");
  };

  return (
    <div>
      {product.sizes.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-wider text-navy-700 mb-2">
            Size {size && <span className="text-brand-700">· {size}</span>}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                onClick={() => setSize(s)}
                className={`min-w-12 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-colors cursor-pointer ${
                  size === s ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-brand-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper value={qty} onChange={setQty} />
        <p className="text-sm text-slate-500">
          Total: <span className="font-black text-navy-700 text-base">{formatPrice(product.finalPrice * qty)}</span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || needsSize || busy}
          className={`py-3.5 px-6 rounded-full text-sm font-black flex items-center justify-center gap-2 border-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            added
              ? "bg-brand-600 border-brand-600 text-white scale-[1.02]"
              : product.isPreOrder
                ? "border-violet-600 text-violet-700 hover:bg-violet-50"
                : "border-brand-600 text-brand-700 hover:bg-brand-50"
          }`}
        >
          {added ? <Check className="w-5 h-5" /> : product.isPreOrder ? <CalendarClock className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
          {added ? "Added to cart!" : needsSize ? "Choose a size" : product.isPreOrder ? "Add Pre-Order to Cart" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock || needsSize || busy}
          className={`py-3.5 px-6 rounded-full text-sm font-black flex items-center justify-center gap-2 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            product.isPreOrder ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110" : "btn-primary-gradient"
          }`}
        >
          {product.isPreOrder ? <CalendarClock className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          {product.isPreOrder ? "Pre-Order Now" : "Buy Now"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => toggle(product)}
        aria-pressed={liked}
        className={`mt-3 w-full py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
          liked ? "border-coral-500 bg-coral-50 text-coral-600" : "border-slate-200 text-slate-600 hover:border-coral-300 hover:text-coral-600"
        }`}
      >
        <Heart className={`w-4 h-4 ${liked ? "fill-coral-500" : ""}`} />
        {liked ? "Saved to Wishlist" : "Add to Wishlist"}
      </button>
    </div>
  );
}
