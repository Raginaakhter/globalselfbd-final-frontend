import Link from "next/link";
import { BadgeCheck, Quote } from "lucide-react";
import { fetchHomepageReviews } from "@/lib/server/storefront";
import ProductImage from "@/components/shop/ProductImage";
import Stars from "@/components/reviews/Stars";

/** Homepage carousel of reviews an admin marked "show on homepage". Hidden when there are none. */
export default async function CustomerReviews() {
  const reviews = await fetchHomepageReviews();
  if (!reviews.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-navy-700 tracking-tight flex items-center gap-3">
          <span className="w-1.5 h-6 sm:h-7 rounded-full bg-gradient-to-b from-brand-400 to-brand-700" />
          What Our Customers Say
        </h2>
        <p className="text-sm text-slate-500 mt-0.5 ml-[18px]">গ্রাহকদের মতামত</p>
      </div>
      <ul className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        {reviews.map((r) => (
          <li key={r._id} className="snap-start shrink-0 w-[85%] sm:w-[340px] rounded-3xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between">
              <Stars value={r.rating} />
              <Quote className="w-6 h-6 text-brand-200" />
            </div>
            {r.comment && <p className="text-sm text-slate-600 leading-relaxed mt-3 line-clamp-4 flex-1">{r.comment}</p>}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-bold text-navy-700 flex items-center gap-1.5">
                {r.customerName}
                {r.verifiedPurchase && <BadgeCheck className="w-4 h-4 text-brand-600" aria-label="Verified purchase" />}
              </p>
              <Link href={`/product/${r.productSlug}`} className="mt-2 flex items-center gap-2 group">
                <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  <ProductImage image={r.productImage} alt={r.productName} />
                </span>
                <span className="text-xs font-semibold text-slate-500 group-hover:text-brand-700 line-clamp-1">{r.productName}</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
