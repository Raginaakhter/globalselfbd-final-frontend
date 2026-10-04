// Shared (client + server safe) types for storefront content: live data from the public API
// (categories, banners, brands, footer) plus static copy from site-content.ts.
import type { Banner, Brand } from "@/lib/backend-types";
import type { StoreCategory } from "@/lib/storefront";
import { SHIPPING_INSIDE_DHAKA, SHIPPING_OUTSIDE_DHAKA } from "@/lib/storefront";

export type Category = StoreCategory;

export type SocialLink = { label: string; url: string };

export type SiteSettings = {
  siteName: string;
  tagline: string;
  email: string;
  phone: string; // empty = not set, hidden in the UI
  whatsapp: string; // digits only, e.g. "8801XXXXXXXXX"; empty = hidden
  address: string;
  socials: SocialLink[];
  topBarText: string;
  complaintTitle: string;
  complaintNote: string;
  shippingInsideDhaka: number;
  shippingOutsideDhaka: number;
};

export type TrustBadge = { title: string; body: string; emoji: string };

/** Top navigation entry. When `children` is set, the header renders it as a dropdown. */
export type NavLink = { label: string; href: string; hot?: boolean; badge?: string; children?: { label: string; href: string }[] };

export type FooterColumn = { title: string; links: { label: string; href: string }[] };

export type PromoBannerContent = {
  badge: string;
  title: string;
  highlight: string;
  body: string;
  bn: string;
  cta: string;
  href: string;
};

export type SiteData = {
  settings: SiteSettings;
  /** Root categories from GET /api/public/categories (with children). */
  categories: StoreCategory[];
  /** Big banners for the landing page slider (GET /api/public/banners, placement HERO). */
  banners: Banner[];
  /** Promo cards beside the slider, max 2 (placement PROMO). */
  promoCards: Banner[];
  trustBadges: TrustBadge[];
  navLinks: NavLink[];
  footerColumns: FooterColumn[];
  promoBanner: PromoBannerContent | null;
  /** Shop Top Brands, from GET /api/public/brands?featured=true. */
  brands: Brand[];
  /** Footer logo and copyright from GET /api/public/footer (empty = use the defaults). */
  footerLogoUrl: string;
  copyrightText: string;
};

// Safe fallback used before the layout has loaded, so the UI never crashes.
export const EMPTY_SITE: SiteData = {
  settings: {
    siteName: "Global Shelf BD",
    tagline: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    socials: [],
    topBarText: "",
    complaintTitle: "",
    complaintNote: "",
    shippingInsideDhaka: SHIPPING_INSIDE_DHAKA,
    shippingOutsideDhaka: SHIPPING_OUTSIDE_DHAKA,
  },
  categories: [],
  banners: [],
  promoCards: [],
  trustBadges: [],
  navLinks: [],
  footerColumns: [],
  promoBanner: null,
  brands: [],
  footerLogoUrl: "",
  copyrightText: "",
};
