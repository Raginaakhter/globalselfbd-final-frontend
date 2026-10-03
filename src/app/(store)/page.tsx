import {
  Hero,
  TrustBar,
  CategoryGrid,
  ProductSection,
  PromoBanner,
  BrandsMarquee,
  DeliveryPromise,
  AboutIntro,
  CustomerReviews,
  Newsletter,
} from "@/components/landing";
import ComboSection from "@/components/landing/ComboSection";
import { fetchCombos, fetchProducts } from "@/lib/server/storefront";

export default async function Home() {
  // The public API has no "best sellers" data, so the home page shows the newest products and the discounted ones.
  const [newest, recentPool, combos] = await Promise.all([
    fetchProducts({ sort: "newest", limit: 8 }),
    fetchProducts({ sort: "newest", limit: 60 }),
    fetchCombos({ limit: 4 }),
  ]);
  const deals = recentPool.products.filter((p) => p.discountPercent > 0).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 8);

  return (
    <>
      <Hero />
      <TrustBar />
      <CategoryGrid />
      <ProductSection id="new-arrivals" title="New Arrivals" bn="নতুন এসেছে" products={newest.products} href="/shop?sort=newest" />
      <ComboSection combos={combos.combos} />
      <ProductSection id="deals" title="Top Deals — Save Big" bn="সেরা অফার, সেরা দাম" products={deals} tone="tinted" href="/offer" />
      <PromoBanner />
      <BrandsMarquee />
      <DeliveryPromise />
      <CustomerReviews />
      <AboutIntro />
      <Newsletter />
    </>
  );
}
