"use client";

import Link from "next/link";
import SectionHeading from "./SectionHeading";
import { useSite } from "@/context/SiteContext";
import CategoryIcon from "@/components/shop/CategoryIcon";

export default function CategoryGrid() {
  const { categories } = useSite();
  if (categories.length === 0) return null;

  return (
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-32">
      <SectionHeading title="Shop By Category" bn="আপনার পছন্দের ক্যাটাগরি বেছে নিন" />
      <div className="stagger-in grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/shop?category=${c.slug}`}
            className="category-tile group flex flex-col items-center text-center rounded-2xl bg-white border border-slate-200 p-3 sm:p-4"
          >
            <CategoryIcon category={c} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xs sm:text-sm font-bold text-navy-700 leading-tight">{c.name}</span>
            {!!c.children?.length && <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">{c.children.length} sub-categories</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
