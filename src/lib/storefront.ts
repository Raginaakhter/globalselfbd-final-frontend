// Storefront shapes returned by the public backend endpoints (GET /api/public/*). Client + server safe.
import type { ProductRating, ProductUnit, Status } from "@/lib/backend-types";

export interface StoreCategory {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string;
  parentCategoryId: string | null;
  children?: StoreCategory[];
}

/** A public product: never includes stock numbers or cost. */
export interface StoreProduct {
  _id: string;
  productTitle: string;
  slug: string;
  productDescription: string;
  categoryId: { _id: string; name: string; slug: string; status: Status } | null;
  customerSellPrice: number;
  customerSpecialPrice: number | null;
  finalPrice: number;
  discountPercent: number;
  isFabric: boolean;
  sizes: string[];
  unit: ProductUnit | null;
  quantity: number | null;
  thumbnail: string;
  gallery: string[];
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  /** Sells with no stock requirement; availability is always IN_STOCK. */
  isPreOrder?: boolean;
  /** Minimum delivery window promised in days (≥ 15). */
  preOrderMinDays?: number;
  /** Average of APPROVED reviews */
  rating?: ProductRating;
  createdAt: string;
  breadcrumb?: { _id: string; name: string; slug: string }[];
}

/** "5 KG", "500 ML" … or empty when the product has no unit. */
export const packLabel = (p: Pick<StoreProduct, "unit" | "quantity">) => (p.unit && p.quantity ? `${p.quantity} ${p.unit}` : "");

/** Flattens the category tree (parents before children). */
export function flattenCategories(tree: StoreCategory[]): StoreCategory[] {
  return tree.flatMap((c) => [c, ...flattenCategories(c.children ?? [])]);
}

// Fallback delivery charges, used only if GET /api/public/shipping cannot be reached.
// The real values are managed in the dashboard (Delivery Charges) and read from the API.
export const SHIPPING_INSIDE_DHAKA = 80;
export const SHIPPING_OUTSIDE_DHAKA = 130;
export const PRODUCT_SORTS = ["newest", "oldest", "price_asc", "price_desc", "title_asc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
