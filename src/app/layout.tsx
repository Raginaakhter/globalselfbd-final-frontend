import type { Metadata } from "next";
import { LOGO_URL } from "@/lib/brand";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import CartDrawer from "@/components/shop/CartDrawer";
import { Toaster } from "sonner";
import { SiteProvider } from "@/context/SiteContext";
import { fetchSite } from "@/lib/site-fetch";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.globalshelfbd.com";
const SITE_TITLE = "Global Shelf BD - Authentic Global Products, Delivered Across Bangladesh";
const SITE_DESCRIPTION = "Global Shelf BD! Next-generation e-commerce platform bringing premium authentic global products to Bangladesh.";

export const metadata: Metadata = {
  // Resolves relative URLs in openGraph/twitter images to absolute ones for crawlers
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: ["Global Shelf BD", "E-commerce Bangladesh", "Online Shopping BD", "Global Products"],
  authors: [{ name: "Global Shelf BD Team" }],
  openGraph: {
    // Preview shown when the URL is shared on Facebook, WhatsApp, LinkedIn etc.
    type: "website",
    siteName: "Global Shelf BD",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [{ url: LOGO_URL, width: 786, height: 662, alt: "Global Shelf BD" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [LOGO_URL],
  },
};

// Storefront content is read from the API on every request, so DB edits show up immediately.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await fetchSite();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-[#f5f8fc] text-slate-900 selection:bg-brand-500 selection:text-white" suppressHydrationWarning>
          <AuthProvider>
            <SiteProvider value={site}>
            <WishlistProvider>
            <CartProvider>
              {children}
              <CartDrawer />
            </CartProvider>
            </WishlistProvider>
            </SiteProvider>
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
      </body>
    </html>
  );
}

