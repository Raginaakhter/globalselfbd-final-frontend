"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { CartV2 as Cart, Combo } from "@/lib/backend-types";
import type { StoreProduct } from "@/lib/storefront";

const LOCAL_KEY = "gsbd-cart-v2";
const MAX_QTY = 10;

/**
 * One cart line. Signed-in customers use the backend cart (GET/POST/PUT/DELETE /api/cart), whose prices
 * the server refreshes on every read. Guests keep lines in localStorage with the price seen when adding;
 * they are moved into the backend cart right after login, and checkout always uses the backend cart.
 */
export type CartLine = {
  /** Backend cart item id, or a local key (productId + size / combo id) for guests. */
  key: string;
  /** Lines saved before combos existed have no type; treat them as products. */
  type?: "product" | "combo";
  /** Empty string for combo lines. */
  productId: string;
  comboId?: string | null;
  /** Member products of a combo line. */
  comboItems?: { productId: string; productTitle: string; quantity: number }[];
  slug: string;
  title: string;
  thumbnail: string;
  unitPrice: number;
  quantity: number;
  size: string | null;
  unit: string | null;
  subtotal: number;
  isAvailable: boolean;
  issue: string | null;
};

type AddOptions = { size?: string | null; openDrawer?: boolean; silent?: boolean };

interface CartContextType {
  lines: CartLine[];
  count: number;
  /** Sum of the lines that can be ordered. */
  subtotal: number;
  hasIssues: boolean;
  /** "server" once the cart lives in the backend (signed-in customer). */
  source: "server" | "local";
  hydrated: boolean;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: StoreProduct, qty?: number, opts?: AddOptions) => Promise<boolean>;
  addCombo: (combo: Combo, qty?: number, opts?: Omit<AddOptions, "size">) => Promise<boolean>;
  setQty: (key: string, qty: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Reloads the backend cart (e.g. after an order was placed). */
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function readLocal(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((l) => l && l.quantity > 0 && (typeof l.comboId === "string" || (typeof l.productId === "string" && l.productId)))
      : [];
  } catch {
    return [];
  }
}

function writeLocal(lines: CartLine[]) {
  try {
    if (lines.length) localStorage.setItem(LOCAL_KEY, JSON.stringify(lines));
    else localStorage.removeItem(LOCAL_KEY);
  } catch {
    // ignore quota / private-mode errors
  }
}

const fromServer = (cart: Cart | null | undefined): CartLine[] =>
  (cart?.items ?? []).map((i) => {
    const isCombo = i.type === "combo" || (!!i.comboId && !i.productId);
    return {
      key: i._id,
      type: isCombo ? ("combo" as const) : ("product" as const),
      productId: i.productId ?? "",
      comboId: i.comboId ?? null,
      comboItems: i.comboSnapshot?.items?.map((m) => ({ productId: m.productId, productTitle: m.productTitle, quantity: m.quantity })),
      slug: (isCombo ? i.comboSnapshot?.slug : i.productSnapshot?.slug) ?? i.productId ?? i.comboId ?? "",
      title: (isCombo ? i.comboSnapshot?.comboTitle : i.productSnapshot?.productTitle) ?? (isCombo ? "Combo" : "Product"),
      thumbnail: (isCombo ? i.comboSnapshot?.thumbnail : i.productSnapshot?.thumbnail) ?? "",
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      size: i.selectedSize,
      unit: i.selectedUnit,
      subtotal: i.subtotal,
      isAvailable: i.isAvailable,
      issue: i.issue,
    };
  });

const comboKey = (comboId: string) => `combo:${comboId}`;

const localKey = (productId: string, size: string | null) => `${productId}:${size ?? ""}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading, hasPermission, api } = useAuth();
  const useServer = isAuthenticated && hasPermission("cart.manage");

  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const source: "server" | "local" = useServer ? "server" : "local";
  const sourceRef = useRef(source);
  sourceRef.current = source;

  const applyServer = useCallback((cart: Cart | null | undefined) => {
    if (sourceRef.current === "server") setLines(fromServer(cart));
  }, []);

  const refresh = useCallback(async () => {
    if (sourceRef.current !== "server") return;
    setLoading(true);
    try {
      const res = await api<Cart>("/cart");
      applyServer(res.data);
    } catch {
      // keep the last known cart
    } finally {
      setLoading(false);
    }
  }, [api, applyServer]);

  // Pick the cart source once auth is known: guests read localStorage; customers merge it into the backend cart.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    queueMicrotask(async () => {
      if (!useServer) {
        setLines(readLocal());
        setHydrated(true);
        return;
      }
      setLoading(true);
      const pending = readLocal();
      let failed = 0;
      for (const l of pending) {
        try {
          const payload =
            l.type === "combo" && l.comboId
              ? { comboId: l.comboId, quantity: l.quantity }
              : { productId: l.productId, quantity: l.quantity, size: l.size ?? undefined, unit: l.unit ?? undefined };
          await api("/cart", { method: "POST", body: JSON.stringify(payload) });
        } catch {
          failed++;
        }
      }
      if (pending.length) {
        writeLocal([]);
        if (failed) toast.warning(`${failed} item${failed === 1 ? "" : "s"} from your guest cart could not be added (no longer available).`);
      }
      try {
        const res = await api<Cart>("/cart");
        if (!cancelled) setLines(fromServer(res.data));
      } catch {
        if (!cancelled) setLines([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, useServer, api]);

  // Keep other tabs' guest carts in sync.
  useEffect(() => {
    if (useServer) return;
    const onStorage = (e: StorageEvent) => e.key === LOCAL_KEY && setLines(readLocal());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [useServer]);

  // Lock page scroll while the drawer is open, close it on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const updateLocal = useCallback((fn: (cur: CartLine[]) => CartLine[]) => {
    const next = fn(readLocal()).map((l) => ({ ...l, subtotal: l.unitPrice * l.quantity }));
    writeLocal(next);
    setLines(next);
  }, []);

  const serverCall = useCallback(
    async (path: string, init: RequestInit) => {
      setLoading(true);
      try {
        const res = await api<Cart>(path, init);
        applyServer(res.data);
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update your cart");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api, applyServer]
  );

  const addItem = useCallback<CartContextType["addItem"]>(
    async (product, qty = 1, opts = {}) => {
      const size = opts.size ?? null;
      if (product.sizes.length && !size) {
        toast.info("Please choose a size first.");
        return false;
      }
      if (product.availability === "OUT_OF_STOCK") {
        toast.error("This product is out of stock.");
        return false;
      }
      let ok = true;
      if (sourceRef.current === "server") {
        ok = await serverCall("/cart", {
          method: "POST",
          body: JSON.stringify({ productId: product._id, quantity: qty, size: size ?? undefined, unit: product.unit ?? undefined }),
        });
      } else {
        const key = localKey(product._id, size);
        updateLocal((cur) => {
          const existing = cur.find((l) => l.key === key);
          if (existing) return cur.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.quantity + qty, MAX_QTY) } : l));
          return [
            ...cur,
            {
              key,
              type: "product",
              productId: product._id,
              slug: product.slug,
              title: product.productTitle,
              thumbnail: product.thumbnail,
              unitPrice: product.finalPrice,
              quantity: Math.min(qty, MAX_QTY),
              size,
              unit: product.unit,
              subtotal: product.finalPrice * qty,
              isAvailable: true,
              issue: null,
            },
          ];
        });
      }
      if (ok) {
        if (!opts.silent) toast.success(`${product.productTitle} added to cart`);
        if (opts.openDrawer !== false) setDrawerOpen(true);
      }
      return ok;
    },
    [serverCall, updateLocal]
  );

  const addCombo = useCallback<CartContextType["addCombo"]>(
    async (combo, qty = 1, opts = {}) => {
      let ok = true;
      if (sourceRef.current === "server") {
        // Backend validates stock on every member product and merges repeat adds.
        ok = await serverCall("/cart", { method: "POST", body: JSON.stringify({ comboId: combo._id, quantity: qty }) });
      } else {
        const key = comboKey(combo._id);
        updateLocal((cur) => {
          const existing = cur.find((l) => l.key === key);
          if (existing) return cur.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.quantity + qty, MAX_QTY) } : l));
          return [
            ...cur,
            {
              key,
              type: "combo",
              productId: "",
              comboId: combo._id,
              comboItems: combo.itemDetails?.map((d) => ({ productId: d.productId, productTitle: d.productTitle, quantity: d.quantity })),
              slug: combo.slug,
              title: combo.comboTitle,
              thumbnail: combo.thumbnail,
              unitPrice: combo.comboPrice,
              quantity: Math.min(qty, MAX_QTY),
              size: null,
              unit: null,
              subtotal: combo.comboPrice * qty,
              isAvailable: true,
              issue: null,
            },
          ];
        });
      }
      if (ok) {
        if (!opts.silent) toast.success(`${combo.comboTitle} added to cart`);
        if (opts.openDrawer !== false) setDrawerOpen(true);
      }
      return ok;
    },
    [serverCall, updateLocal]
  );

  const setQty = useCallback<CartContextType["setQty"]>(
    async (key, qty) => {
      if (qty <= 0) {
        if (sourceRef.current === "server") await serverCall(`/cart/${key}`, { method: "DELETE" });
        else updateLocal((cur) => cur.filter((l) => l.key !== key));
        return;
      }
      const quantity = Math.min(qty, MAX_QTY);
      if (sourceRef.current === "server") await serverCall(`/cart/${key}`, { method: "PUT", body: JSON.stringify({ quantity }) });
      else updateLocal((cur) => cur.map((l) => (l.key === key ? { ...l, quantity } : l)));
    },
    [serverCall, updateLocal]
  );

  const removeItem = useCallback((key: string) => setQty(key, 0), [setQty]);

  const clear = useCallback(async () => {
    if (sourceRef.current === "server") await serverCall("/cart", { method: "DELETE" });
    else updateLocal(() => []);
  }, [serverCall, updateLocal]);

  const value = useMemo<CartContextType>(() => {
    const available = lines.filter((l) => l.isAvailable);
    return {
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: available.reduce((n, l) => n + l.subtotal, 0),
      hasIssues: lines.some((l) => !l.isAvailable),
      source,
      hydrated,
      loading,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem,
      addCombo,
      setQty,
      removeItem,
      clear,
      refresh,
    };
  }, [lines, source, hydrated, loading, drawerOpen, addItem, addCombo, setQty, removeItem, clear, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export const MAX_CART_QTY = MAX_QTY;

/** Storefront page for a cart line. */
export const lineHref = (l: Pick<CartLine, "type" | "slug">) => (l.slug ? (l.type === "combo" ? `/combo/${l.slug}` : `/product/${l.slug}`) : "#");
