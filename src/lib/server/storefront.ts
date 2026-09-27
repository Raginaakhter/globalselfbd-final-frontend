// Server-side only: storefront data for server components, straight from the public backend API.

import type { Pagination, StoreCategory, StoreProduct } from "@/lib/storefront";
import { EMPTY_FOOTER, type Banner, type Brand, type FooterSettings, type ShippingSettings } from "@/lib/backend-types";
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
