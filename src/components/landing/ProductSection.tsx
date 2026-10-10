import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";
import type { StoreProduct } from "@/lib/storefront";

type Props = {
  id: string;
  title: string;
  bn?: string;
  products: StoreProduct[];
  tone?: "plain" | "tinted";
  href?: string;
};

export default function ProductSection({ id, title, bn, products, tone = "plain", href }: Props) {
  if (products.length === 0) return null;

  const grid = (
    <div className="stagger-in grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );

  if (tone === "tinted") {
    return (
      <section id={id} className="mt-12 py-10 bg-gradient-to-b from-brand-50 to-white border-y border-brand-100 scroll-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title={title} bn={bn} href={href} />
          {grid}
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-32">
      <SectionHeading title={title} bn={bn} href={href} />
      {grid}
    </section>
  );
}
