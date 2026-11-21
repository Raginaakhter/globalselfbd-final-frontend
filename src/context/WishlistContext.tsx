"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { StoreProduct } from "@/lib/storefront";
import { trackEvent } from "@/lib/analytics-tracker";

const KEY = "gsbd-wishlist";

interface WishlistContextType {
  /** Saved products, newest first. */
  products: StoreProduct[];
  count: number;
  hydrated: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (product: StoreProduct) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function read(): StoreProduct[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p._id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The backend has no wishlist API yet, so saved products live in this browser (localStorage).
 * A copy of each product is kept so the wishlist page renders without extra requests.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setProducts(read());
      setHydrated(true);
    });
    const onStorage = (e: StorageEvent) => e.key === KEY && setProducts(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((product: StoreProduct) => {
    const cur = read();
    const exists = cur.some((p) => p._id === product._id);
    const next = exists ? cur.filter((p) => p._id !== product._id) : [product, ...cur];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore quota / private-mode errors
    }
    setProducts(next);
    void trackEvent({
      eventName: exists ? "wishlist_remove" : "wishlist_add",
      productId: product._id,
      metadata: { price: product.finalPrice },
    });
    toast.success(`${product.productTitle} ${exists ? "removed from" : "added to"} wishlist`);
  }, []);

  const value = useMemo<WishlistContextType>(() => {
    const ids = new Set(products.map((p) => p._id));
    return { products, count: products.length, hydrated, isWishlisted: (id) => ids.has(id), toggle };
  }, [products, hydrated, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
