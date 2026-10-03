import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Flame, CalendarClock } from "lucide-react";
import ProductCard from "@/components/landing/ProductCard";
import StoreSearchBar from "@/components/shop/StoreSearchBar";
import { fetchOffers, fetchProducts } from "@/lib/server/storefront";
import type { Offer } from "@/lib/backend-types";
import { formatPrice } from "@/lib/shop";

const offerDiscount = (o: Offer) => (o.discountType === "PERCENTAGE" ? `${o.discountValue}% OFF` : `${formatPrice(o.discountValue)} OFF`);
const endsLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const metadata: Metadata = {
  title: "Offers & Deals | Global Shelf BD",
  description: "All discounted products in one place — grab authentic imported items at the best prices.",
};

const PAGE_SIZE = 24;
const POOL_SIZE = 240;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function OfferPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const page = Math.max(parseInt(first(sp.page), 10) || 1, 1);

  const [{ products, error }, { offers }] = await Promise.all([
    fetchProducts({ sort: "newest", limit: POOL_SIZE, search: q }),
    fetchOffers({ limit: 12 }),
  ]);

  const queryLower = q.toLowerCase();
  const words = queryLower.split(/\s+/).filter(Boolean);

  const deals = products
    .filter((p) => p.discountPercent > 0)
    .filter((p) => {
      if (!words.length) return true;
      const title = (p.productTitle || "").toLowerCase();
      const desc = (p.productDescription || "").toLowerCase();
      const slug = (p.slug || "").toLowerCase();
      const cat = (p.categoryId?.name || "").toLowerCase();
      return words.every((w) => title.includes(w) || desc.includes(w) || slug.includes(w) || cat.includes(w));
    })
    .sort((a, b) => b.discountPercent - a.discountPercent);

  const filteredOffers = offers.filter((o) => {
    if (!words.length) return true;
    const title = (o.title || "").toLowerCase();
    const desc = (o.description || "").toLowerCase();
    return words.every((w) => title.includes(w) || desc.includes(w));
  });

  const total = deals.length;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const current = Math.min(page, totalPages);
  const pageItems = deals.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/offer?${qs}` : "/offer";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <span className="font-semibold text-navy-700">Offers</span>
      </nav>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 text-white px-6 sm:px-10 py-8 sm:py-10 mb-6 shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/30 text-[11px] font-black uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5" /> Hot Deals
          </span>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight mt-3">
            All Offers & Discounts
          </h1>
          <p className="text-sm sm:text-base text-white/90 mt-2">
            {total === 0
              ? "No active offers found — check back soon."
              : `${total} ${total === 1 ? "product is" : "products are"} on sale right now.`}
          </p>
        </div>
        <Flame className="hidden sm:block absolute -right-6 -bottom-8 w-48 h-48 text-white/10" />
      </section>

      <div className="mb-6">
        <StoreSearchBar placeholder="Search offers and discounted products (e.g. honey, vitamin, soap)..." />
      </div>

      {filteredOffers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-black text-navy-700 mb-3">Running Campaigns</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOffers.map((o) => (
              <Link
                key={o._id}
                href={`/offer/${o.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[16/7] bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100">
                  {o.bannerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.bannerImage} alt={o.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <Flame className="absolute inset-0 m-auto h-16 w-16 text-rose-300" />
                  )}
                  {o.badgeLabel && (
                    <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-black uppercase text-white shadow" style={{ backgroundColor: o.badgeColor || "#f43f5e" }}>
                      {o.badgeLabel}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-navy-700 line-clamp-1 group-hover:text-brand-700">{o.title}</h3>
                    <span className="shrink-0 text-sm font-black text-coral-500">{offerDiscount(o)}</span>
                  </div>
                  {o.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{o.description}</p>}
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5" /> Ends {endsLabel(o.endsAt)}
                    {o.minOrderValue ? ` · Min order ${formatPrice(o.minOrderValue)}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg sm:text-xl font-black text-navy-700">Discounted Products</h2>
        {q && (
          <span className="text-xs font-semibold text-slate-500">
            Results for: <strong className="text-navy-700">&ldquo;{q}&rdquo;</strong>
          </span>
        )}
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm font-semibold text-rose-700">Could not load offers: {error}</p>
      ) : pageItems.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 py-20 text-center px-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <SearchX className="w-9 h-9 text-brand-600" />
          </div>
          <h2 className="text-xl font-black text-navy-700">{q ? "No matching products found" : "No offers available"}</h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">{q ? `No discounted products match "${q}". Try another keyword.` : "Please check back later for new deals."}</p>
          <Link href={q ? "/offer" : "/shop"} className="inline-block px-6 py-3 rounded-full text-sm font-bold text-white btn-primary-gradient">
            {q ? "Clear search" : "Browse all products"}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {pageItems.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-3 text-sm font-bold" aria-label="Pagination">
              {current > 1 && (
                <Link href={href(current - 1)} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-navy-700 hover:border-brand-400">
                  ← Previous
                </Link>
              )}
              <span className="text-slate-500">Page {current} of {totalPages}</span>
              {current < totalPages && (
                <Link href={href(current + 1)} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-navy-700 hover:border-brand-400">
                  Next →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
