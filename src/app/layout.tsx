import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Global Shelf BD - Authentic Global Products, Delivered Across Bangladesh",
  description:
    "Global Shelf BD! Next-generation e-commerce platform bringing premium authentic global products to Bangladesh.",
  keywords: ["Global Shelf BD", "E-commerce Bangladesh", "Online Shopping BD", "Global Products"],
  authors: [{ name: "Global Shelf BD Team" }],
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

