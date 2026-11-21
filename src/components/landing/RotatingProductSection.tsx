"use client";

import { useEffect, useMemo, useState } from "react";
import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";
import type { StoreProduct } from "@/lib/storefront";

type Props = {
  id: string;
  title: string;
  bn?: string;
  /** The full pool of newest products; the component picks a random `displayCount` slice per page load. */
  products: StoreProduct[];
  tone?: "plain" | "tinted";
  href?: string;
  /** How many cards show at once (default 20). */
  displayCount?: number;
};

export default function RotatingProductSection({
  id,
  title,
  bn,
  products,
  tone = "plain",
  href,
  displayCount = 20,
}: Props) {
  const [offset, setOffset] = useState(0);

  const canRotate = products.length > displayCount;

  // Pick a random starting slice after hydration, so each browser reload shows a different batch.
  useEffect(() => {
    if (!canRotate) return;
    setOffset(Math.floor(Math.random() * products.length));
  }, [canRotate, products.length]);

  const slice = useMemo(() => {
    if (!canRotate) return products;
    const wrapped = [...products.slice(offset), ...products.slice(0, offset)];
    return wrapped.slice(0, displayCount);
  }, [canRotate, products, offset, displayCount]);

  if (products.length === 0) return null;

  const grid = (
    <div className="stagger-in grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {slice.map((p) => (
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
