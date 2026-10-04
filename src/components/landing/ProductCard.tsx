"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Heart, ShoppingBag, Zap } from "lucide-react";
import { packLabel, type StoreProduct } from "@/lib/storefront";
import { formatPrice } from "@/lib/shop";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductImage from "@/components/shop/ProductImage";
import Stars from "@/components/reviews/Stars";

export default function ProductCard({ product }: { product: StoreProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  const { _id: id, slug, productTitle: name, finalPrice: price, customerSellPrice: rrp, discountPercent, thumbnail, categoryId } = product;
  const liked = isWishlisted(id);
  const href = `/product/${slug}`;
  const detail = product.sizes.length ? `Sizes: ${product.sizes.join(", ")}` : packLabel(product);
  const outOfStock = product.availability === "OUT_OF_STOCK";
  // Products with sizes need a size picked on the product page first.
  const needsChoice = product.sizes.length > 0;
  const discountAmount = rrp > price ? rrp - price : 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsChoice) return router.push(href);
    if (await addItem(product, 1)) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsChoice) return router.push(href);
    if (await addItem(product, 1, { openDrawer: false, silent: true })) router.push("/checkout");
  };

  const badgeClass = "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white shadow-sm";

  return (
    <article className="product-card group relative flex flex-col justify-between w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div>
        <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-3 mb-3 transition-colors">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(product);
            }}
            aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={liked}
            className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-md border border-slate-100 text-slate-700 transition-all hover:scale-110 active:scale-95"
          >
            <Heart className={`h-4 w-4 sm:h-4.5 sm:w-4.5 transition-colors ${liked ? "fill-rose-500 text-rose-500" : "text-slate-600 hover:text-rose-500"}`} />
          </button>

          <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1 items-start max-w-[70%]">
            {product.isPreOrder ? (
              <span className={`${badgeClass} bg-gradient-to-r from-violet-600 to-fuchsia-600`}>
                Pre-Order{product.preOrderMinDays ? ` · ${product.preOrderMinDays}d` : ""}
              </span>
            ) : outOfStock ? (
              <span className={`${badgeClass} bg-slate-700`}>Out of stock</span>
            ) : discountPercent > 0 ? (
              <span className={`${badgeClass} bg-blue-600`}>{discountPercent}% OFF</span>
            ) : null}
          </div>

          {discountPercent >= 15 && !outOfStock && (
            <div className="absolute right-2.5 bottom-2.5 z-10 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[10px] ring-2 ring-blue-300 shadow-md transform rotate-12">
              <span className="text-center leading-none">-{discountPercent}%</span>
            </div>
          )}

          <Link href={href} className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <ProductImage image={thumbnail} alt={name} className="transition-transform duration-500 group-hover:scale-110" />
          </Link>
        </div>

        <div className="flex flex-col">
          {categoryId?.name && <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mb-1">{categoryId.name}</p>}

          <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors mb-1.5 min-h-[2.4rem]">
            <Link href={href}>{name}</Link>
          </h3>

          {detail && <p className="text-[11px] sm:text-xs font-medium text-slate-500 mb-2 line-clamp-1">{detail}</p>}
          {!!product.rating?.totalReviews && (
            <p className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
              <Stars value={product.rating.averageRating} size="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="font-semibold">({product.rating.totalReviews})</span>
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline gap-2 flex-wrap mb-3">
          <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{formatPrice(price)}</span>
          {discountAmount > 0 && <span className="text-xs font-semibold text-slate-400 line-through">WAS {formatPrice(rrp)}</span>}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Add ${name} to cart`}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-blue-600/40 bg-blue-50/50 px-2 py-2 text-[11px] sm:text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-600 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-blue-600">Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{needsChoice ? "Choose size" : "Add to cart"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            aria-label={`Buy ${name} now`}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-900 hover:bg-blue-950 px-2 py-2 text-[11px] sm:text-xs font-black text-white shadow-sm transition-all hover:brightness-110 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
          >
            <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
            <span>Buy now</span>
          </button>
        </div>
      </div>
    </article>
  );
}
