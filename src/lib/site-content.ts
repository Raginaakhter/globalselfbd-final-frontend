// Static storefront copy with no backend API (trust badges, nav links, promo banner). Contact details come only
// from the Footer settings in the dashboard (GET /api/public/footer); the footer link columns here are the default
// until columns are set there.
import type { SiteData } from "@/lib/site-types";
import { SHIPPING_INSIDE_DHAKA, SHIPPING_OUTSIDE_DHAKA } from "@/lib/storefront";

export const SITE_CONTENT: Omit<SiteData, "categories" | "banners" | "promoCards" | "brands" | "footerLogoUrl" | "copyrightText"> = {
  settings: {
    siteName: "Global Shelf BD",
    tagline: "Your Trusted Global E-Commerce Store in Bangladesh",
    // Contact details and social links come only from Dashboard → Footer; empty values are hidden.
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    socials: [],
    topBarText: "100% Authentic Imported Products.",
    complaintTitle: "Customer Care & Complaints",
    complaintNote: "",
    shippingInsideDhaka: SHIPPING_INSIDE_DHAKA,
    shippingOutsideDhaka: SHIPPING_OUTSIDE_DHAKA,
  },
  trustBadges: [
    { title: "100% Authentic", body: "Directly imported from UK & USA official sources", emoji: "🛡️" },
    { title: "Fast Delivery", body: "1–3 days inside Dhaka, 3–5 days nationwide", emoji: "🚀" },
    { title: "Cash on Delivery", body: "Pay conveniently upon receiving your order", emoji: "💵" },
  ],
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Shop All", href: "/shop" },
    { label: "Offer", href: "/offer", hot: true },
    { label: "Combo", href: "/combo" },
    {
      label: "About Us",
      href: "/about",
      // Hover / tap opens a menu with contact + policy pages under the About page
      children: [
        { label: "Contact Us", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Return Policy", href: "/refund-policy" },
        { label: "Shipping Policy", href: "/shipping-policy" },
        { label: "Terms & Conditions", href: "/terms" },
      ],
    },
  ],
  footerColumns: [
    {
      title: "Customer Support",
      links: [
        { label: "Track Your Order", href: "/track-order" },
        { label: "Contact Us", href: "/contact" },
        { label: "About Us", href: "/about" },
        { label: "Shipping Policy", href: "/shipping-policy" },
      ],
    },
    {
      title: "Policies",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Refund & Return Policy", href: "/refund-policy" },
      ],
    },
  ],
  promoBanner: {
    badge: "SUPER SAVINGS WEEK",
    title: "Imported Authentic Healthcare & Beauty Essentials",
    highlight: "CASH ON DELIVERY",
    body: "Order with cash on delivery, delivered to your door across Bangladesh.",
    bn: "প্রিমিয়াম অরিজিনাল প্রোডাক্টের ওপর বিশেষ ছাড়",
    cta: "Shop Collection Now",
    href: "/shop",
  },
};
