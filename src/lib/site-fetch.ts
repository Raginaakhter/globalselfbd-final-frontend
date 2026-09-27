import { cache } from "react";
import { SITE_CONTENT } from "@/lib/site-content";
import { type SiteData, type SocialLink } from "@/lib/site-types";
import { SOCIAL_NETWORKS } from "@/lib/backend-types";
import { fetchBanners, fetchCategoryTree, fetchFeaturedBrands, fetchFooter, fetchShipping } from "@/lib/server/storefront";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
};

/**
 * Server-side helper: storefront content for the layout and pages. Categories, banners, brands and the
 * footer come from the public backend API; the static copy fills anything the admin has not set.
 * Cached per request, so the layout and pages share one set of calls.
 */
export const fetchSite = cache(async (): Promise<SiteData> => {
  const [categories, banners, brands, footer, shipping] = await Promise.all([
    fetchCategoryTree(),
    fetchBanners(),
    fetchFeaturedBrands(),
    fetchFooter(),
    fetchShipping(),
  ]);
  const fallback = SITE_CONTENT.settings;
  const insideDhaka = shipping?.insideDhaka ?? fallback.shippingInsideDhaka;
  const outsideDhaka = shipping?.outsideDhaka ?? fallback.shippingOutsideDhaka;

  const socials: SocialLink[] = SOCIAL_NETWORKS.filter((k) => k !== "whatsapp" && footer.socialLinks[k]).map((k) => ({ label: SOCIAL_LABELS[k], url: footer.socialLinks[k] }));
  // The WhatsApp field holds a link or number; the footer builds its own wa.me link from the digits.
  const whatsapp = footer.socialLinks.whatsapp.replace(/\D/g, "");
  const hasOwnSocials = socials.length > 0 || Boolean(whatsapp);

  const categoryColumn = {
    title: "Categories",
    links: categories.slice(0, 6).map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` })),
  };
  const footerColumns = footer.columns.length
    ? footer.columns.map((c) => ({ title: c.title, links: c.links.map((l) => ({ label: l.label, href: l.url })) }))
    : categories.length
      ? [categoryColumn, ...SITE_CONTENT.footerColumns]
      : SITE_CONTENT.footerColumns;

  return {
    ...SITE_CONTENT,
    promoCards: banners.filter((b) => b.placement === "PROMO").slice(0, 2),
    settings: {
      ...fallback,
      tagline: footer.aboutText || fallback.tagline,
      email: footer.contact.email || fallback.email,
      phone: footer.contact.phone || fallback.phone,
      address: footer.contact.address || fallback.address,
      // The complaint note is built from the real contact details, so it never shows a number that is not set.
      complaintTitle: footer.contact.phone || footer.contact.email ? fallback.complaintTitle : "",
      complaintNote: [
        footer.contact.phone && `call or WhatsApp us at ${footer.contact.phone}`,
        footer.contact.email && `email ${footer.contact.email}`,
      ]
        .filter(Boolean)
        .join(" or ")
        .replace(/^./, (c) => `For any issue or complaint, ${c}`),
      socials: hasOwnSocials ? socials : fallback.socials,
      whatsapp: hasOwnSocials ? whatsapp : fallback.whatsapp,
      topBarText: `🚚 Delivery ৳${insideDhaka} inside Dhaka · ৳${outsideDhaka} nationwide · ${fallback.topBarText}`,
      shippingInsideDhaka: insideDhaka,
      shippingOutsideDhaka: outsideDhaka,
    },
    categories,
    banners: banners.filter((b) => b.placement !== "PROMO"),
    brands,
    footerColumns,
    footerLogoUrl: footer.logoUrl,
    copyrightText: footer.copyrightText,
  };
});
