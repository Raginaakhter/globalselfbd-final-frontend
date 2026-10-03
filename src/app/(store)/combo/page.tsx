import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Package } from "lucide-react";
import ComboCard from "@/components/shop/ComboCard";
import StoreSearchBar from "@/components/shop/StoreSearchBar";
import { fetchCombos } from "@/lib/server/storefront";

export const metadata: Metadata = {
  title: "Combo Offers | Global Shelf BD",
  description: "Bundle deals and combo packs — save more by buying together.",
};

const PAGE_SIZE = 24;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ComboPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const page = Math.max(parseInt(first(sp.page), 10) || 1, 1);

  // Only live combos come back: ACTIVE and inside their startsAt/endsAt window.
  const { combos, pagination, error } = await fetchCombos({ page, limit: PAGE_SIZE, search: q });

  const queryLower = q.toLowerCase();
  const words = queryLower.split(/\s+/).filter(Boolean);
  const filteredCombos = combos.filter((c) => {
    if (!words.length) return true;
    const title = (c.comboTitle || "").toLowerCase();
    const slug = (c.slug || "").toLowerCase();
    const itemNames = (c.itemDetails || []).map((d) => d.productTitle || "").join(" ").toLowerCase();
    return words.every((w) => title.includes(w) || slug.includes(w) || itemNames.includes(w));
  });

  const total = pagination?.total ?? filteredCombos.length;
  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);
  const current = Math.min(page, totalPages);

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/combo?${qs}` : "/combo";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <span className="font-semibold text-navy-700">Combo</span>
      </nav>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white px-6 sm:px-10 py-8 sm:py-10 mb-6 shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/30 text-[11px] font-black uppercase tracking-widest">
            <Package className="w-3.5 h-3.5" /> Bundle Deals
          </span>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight mt-3">Combo Offers</h1>
          <p className="text-sm sm:text-base text-white/90 mt-2">
            {filteredCombos.length === 0
              ? "No combos found right now — check back soon."
              : `${filteredCombos.length} combo ${filteredCombos.length === 1 ? "pack" : "packs"} available — save more when you buy together.`}
          </p>
        </div>
        <Package className="hidden sm:block absolute -right-6 -bottom-8 w-48 h-48 text-white/10" />
      </section>

      <div className="mb-6">
        <StoreSearchBar placeholder="Search combo bundles by name or keyword (e.g. skin care, honey, oil)..." />
      </div>

      {q && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-xs font-semibold text-slate-500">
            Results for: <strong className="text-navy-700">&ldquo;{q}&rdquo;</strong> ({filteredCombos.length} found)
          </span>
          <Link href="/combo" className="text-xs font-bold text-brand-600 hover:underline">
            Clear search
          </Link>
        </div>
      )}

      {error ? (
        <p className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm font-semibold text-rose-700">Could not load combos: {error}</p>
      ) : filteredCombos.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 py-20 text-center px-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <SearchX className="w-9 h-9 text-brand-600" />
          </div>
          <h2 className="text-xl font-black text-navy-700">{q ? "No matching combo packs found" : "No combo packs yet"}</h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">{q ? `No combos match "${q}". Try another keyword.` : "Please check back later for new bundle deals."}</p>
          <Link href={q ? "/combo" : "/shop"} className="inline-block px-6 py-3 rounded-full text-sm font-bold text-white btn-primary-gradient">
            {q ? "Clear search" : "Browse all products"}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredCombos.map((c) => (
              <ComboCard key={c._id} combo={c} />
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
