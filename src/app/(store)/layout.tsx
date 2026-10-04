import { TopBar, Header, Footer } from "@/components/landing";
import CategorySidebar from "@/components/landing/CategorySidebar";
import StoreMain from "@/components/landing/StoreMain";
import { CategorySidebarProvider } from "@/context/CategorySidebarContext";

// Shared storefront chrome for the landing page, shop, product, cart, checkout and order pages.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CategorySidebarProvider>
      <div className="min-h-screen flex flex-col bg-[#f5f8fc] text-slate-900">
        <TopBar />
        <Header />
        <CategorySidebar />
        <StoreMain>{children}</StoreMain>
        <Footer />
      </div>
    </CategorySidebarProvider>
  );
}
