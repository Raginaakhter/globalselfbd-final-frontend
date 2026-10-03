// Server-side only: storefront data for server components, straight from the public backend API.

import { cache } from "react";
import type { Pagination, StoreCategory, StoreProduct } from "@/lib/storefront";
import { EMPTY_FOOTER, type Banner, type Brand, type Combo, type FooterSettings, type HomepageReview, type Offer, type ShippingSettings } from "@/lib/backend-types";
import { callBackend } from "./backend";

export async function fetchCategoryTree(): Promise<StoreCategory[]> {
  const { body } = await callBackend<StoreCategory[]>("/api/public/categories");
  return body.success && Array.isArray(body.data) ? body.data : [];
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
  availability?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function fetchProducts(query: ProductQuery = {}): Promise<{ products: StoreProduct[]; pagination: Pagination | null; error?: string }> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  const { body } = await callBackend<StoreProduct[]>(`/api/public/products${params.size ? `?${params}` : ""}`);
  if (!body.success) return { products: [], pagination: null, error: body.message };
  return { products: body.data ?? [], pagination: (body.pagination as Pagination | undefined) ?? null };
}

/** Product by slug, or null when it doesn't exist / isn't visible to customers. */
export async function fetchProduct(slug: string): Promise<StoreProduct | null> {
  const { body } = await callBackend<StoreProduct>(`/api/public/products/${encodeURIComponent(slug)}`);
  return body.success && body.data ? body.data : null;
}

/** Active landing page banners, in display order. */
export async function fetchBanners(): Promise<Banner[]> {
  const { body } = await callBackend<Banner[]>("/api/public/banners");
  return body.success && Array.isArray(body.data) ? body.data : [];
}

/** Active brands marked for the Shop Top Brands section. */
export async function fetchFeaturedBrands(): Promise<Brand[]> {
  const { body } = await callBackend<Brand[]>("/api/public/brands?featured=true");
  return body.success && Array.isArray(body.data) ? body.data : [];
}

export async function fetchFooter(): Promise<FooterSettings> {
  const { body } = await callBackend<FooterSettings>("/api/public/footer");
  const data = body.success && body.data ? body.data : null;
  return {
    ...EMPTY_FOOTER,
    ...data,
    contact: { ...EMPTY_FOOTER.contact, ...data?.contact },
    socialLinks: { ...EMPTY_FOOTER.socialLinks, ...data?.socialLinks },
    columns: data?.columns ?? [],
  };
}

/** Current delivery charges (GET /api/public/shipping); null when the backend is unreachable. */
export async function fetchShipping(): Promise<ShippingSettings | null> {
  const { body } = await callBackend<ShippingSettings>("/api/public/shipping");
  return body.success && body.data ? body.data : null;
}

/** Approved reviews an admin picked for the homepage carousel. */
export async function fetchHomepageReviews(limit = 12): Promise<HomepageReview[]> {
  const { body } = await callBackend<HomepageReview[]>(`/api/reviews/homepage?limit=${limit}`);
  return body.success && Array.isArray(body.data) ? body.data : [];
}

/* ---------- Combos & offers (public) ---------- */

const toQuery = (q: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") params.set(k, String(v));
  return params.size ? `?${params}` : "";
};

/** Live combos (ACTIVE + inside their time window). */
export async function fetchCombos(query: { page?: number; limit?: number; search?: string } = {}): Promise<{ combos: Combo[]; pagination: Pagination | null; error?: string }> {
  const { body } = await callBackend<Combo[]>(`/api/public/combos${toQuery(query)}`);
  if (!body.success) return { combos: [], pagination: null, error: body.message };
  return { combos: Array.isArray(body.data) ? body.data : [], pagination: (body.pagination as Pagination | undefined) ?? null };
}

/** Single combo by slug (increments views on the backend); null when not live. Cached per request. */
export const fetchCombo = cache(async (slug: string): Promise<Combo | null> => {
  const { body } = await callBackend<Combo>(`/api/public/combos/${encodeURIComponent(slug)}`);
  return body.success && body.data ? body.data : null;
});

/** Active offers whose window includes now. */
export async function fetchOffers(query: { page?: number; limit?: number } = {}): Promise<{ offers: Offer[]; pagination: Pagination | null; error?: string }> {
  const { body } = await callBackend<Offer[]>(`/api/public/offers${toQuery(query)}`);
  if (!body.success) return { offers: [], pagination: null, error: body.message };
  return { offers: Array.isArray(body.data) ? body.data : [], pagination: (body.pagination as Pagination | undefined) ?? null };
}

/** Offer by slug with its in-scope products; null when not found / not live. Cached per request. */
export const fetchOffer = cache(async (slug: string): Promise<(Omit<Offer, "products"> & { products: StoreProduct[] }) | null> => {
  const { body } = await callBackend<Omit<Offer, "products"> & { products: StoreProduct[] }>(`/api/public/offers/${encodeURIComponent(slug)}`);
  return body.success && body.data ? { ...body.data, products: body.data.products ?? [] } : null;
});
