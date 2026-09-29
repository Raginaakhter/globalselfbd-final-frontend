import { TopBar, Header, Footer } from "@/components/landing";

// Shared storefront chrome for the landing page, shop, product, cart, checkout and order pages.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8fc] text-slate-900">
      <TopBar />
      <Header />
      <main className="flex-1 pb-4">{children}</main>
      <Footer />
    </div>
  );
}
