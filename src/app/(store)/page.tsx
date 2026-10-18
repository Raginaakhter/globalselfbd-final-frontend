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
import Reveal from "@/components/landing/Reveal";
import { fetchCombos, fetchProducts } from "@/lib/server/storefront";

export default async function Home() {
  // The public API has no "best sellers" data, so the home page shows the newest products and the discounted ones.
  // Pre-order list includes manually-marked AND auto-flipped stock-out products (backend sets isPreOrder=true for both).
  const [newest, recentPool, combos, preOrder] = await Promise.all([
    fetchProducts({ sort: "newest", limit: 16 }),
    fetchProducts({ sort: "newest", limit: 80 }),
    fetchCombos({ limit: 4 }),
    fetchProducts({ isPreOrder: true, sort: "newest", limit: 12 }),
  ]);
  const deals = recentPool.products.filter((p) => p.discountPercent > 0).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 16);

  return (
    <>
      <Hero />
      <Reveal variant="fade"><TrustBar /></Reveal>
      <Reveal variant="up"><CategoryGrid /></Reveal>
      <Reveal variant="up">
        <ProductSection id="new-arrivals" title="New Arrivals" bn="নতুন এসেছে" products={newest.products} href="/shop?sort=newest" />
      </Reveal>
      <Reveal variant="zoom"><ComboSection combos={combos.combos} /></Reveal>
      <Reveal variant="up">
        <ProductSection id="deals" title="Top Deals — Save Big" bn="সেরা অফার, সেরা দাম" products={deals} tone="tinted" href="/offer" />
      </Reveal>
      {preOrder.products.length > 0 && (
        <Reveal variant="up">
          <ProductSection
            id="pre-order"
            title="Pre-Order Now"
            bn="প্রি-অর্ডার · স্টক-আউট আইটেমও পাবেন এখানে"
            products={preOrder.products}
            href="/pre-order"
          />
        </Reveal>
      )}
      <Reveal variant="left"><PromoBanner /></Reveal>
      <Reveal variant="fade"><BrandsMarquee /></Reveal>
      <Reveal variant="right"><DeliveryPromise /></Reveal>
      <Reveal variant="up"><CustomerReviews /></Reveal>
      <Reveal variant="left"><AboutIntro /></Reveal>
      <Reveal variant="up"><Newsletter /></Reveal>
    </>
  );
}
