import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ShieldCheck, Truck, Clock, Sparkles, SearchX } from "lucide-react";
import ProductCard from "@/components/landing/ProductCard";
import StoreSearchBar from "@/components/shop/StoreSearchBar";
import { fetchProducts } from "@/lib/server/storefront";

export const metadata: Metadata = {
  title: "Pre-Order Authentic Imported Products | Global Shelf BD",
  description: "Pre-order authentic vitamins, skincare, and imported goods directly sourced from UK & USA official distributors.",
};

const sorts = [
  { key: "newest", label: "New arrivals" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "title_asc", label: "Name A–Z" },
] as const;

type SortKey = (typeof sorts)[number]["key"];

const PAGE_SIZE = 24;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function PreOrderPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const sort = (sorts.find((s) => s.key === first(sp.sort))?.key ?? "newest") as SortKey;
  const page = Math.max(parseInt(first(sp.page), 10) || 1, 1);

  // Fetch pre-order products from public API (or filter isPreOrder)
  const { products: allProducts, pagination, error } = await fetchProducts({
    search: q,
    isPreOrder: true,
    sort,
    page,
    limit: PAGE_SIZE,
  });

  // Ensure items shown on this dedicated page are pre-orders
  const preOrderProducts = allProducts.filter((p) => p.isPreOrder ?? true);

  const total = pagination?.total ?? preOrderProducts.length;
  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);
  const current = Math.min(page, totalPages);

  const href = (p: number, s?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if ((s ?? sort) !== "newest") params.set("sort", s ?? sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/pre-order?${qs}` : "/pre-order";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <span className="font-semibold text-navy-700">Pre-Order</span>
      </nav>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-800 text-white px-6 sm:px-10 py-8 sm:py-12 mb-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[11px] font-black uppercase tracking-widest text-violet-100 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sun-400" /> Guaranteed Import Window
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight mt-3">
            Pre-Order Exclusive Imports
          </h1>
          <p className="text-sm sm:text-base text-violet-100/90 mt-3 leading-relaxed">
            Order authentic imported products directly from UK & USA official sources. We allocate fresh stock specifically for your order with promised 15–30 days fulfilment.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-bold text-violet-200">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <Clock className="w-4 h-4 text-sun-400" />
              <span>15–30 Days Promised Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Authentic Guaranteed</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Step-by-Step Live Tracking</span>
            </div>
          </div>
        </div>
        <CalendarClock className="hidden md:block absolute -right-6 -bottom-10 w-64 h-64 text-white/5 pointer-events-none" />
      </section>

      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="w-full sm:max-w-md">
          <StoreSearchBar placeholder="Search pre-order items..." />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Sort by:</span>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {sorts.map((s) => (
              <Link
                key={s.key}
                href={href(1, s.key)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  sort === s.key ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-blue-900"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {q && (
        <div className="flex items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold text-slate-600">
            Showing results for: <strong className="text-navy-700">&ldquo;{q}&rdquo;</strong> ({preOrderProducts.length} items found)
          </span>
          <Link href="/pre-order" className="text-xs font-bold text-brand-600 hover:underline">
            Clear search
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {preOrderProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {preOrderProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200 max-w-md mx-auto my-8">
          <span className="w-16 h-16 rounded-3xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8" />
          </span>
          <h2 className="text-xl font-black text-navy-700">No Pre-Order items found</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            {q ? "No pre-order products match your search query." : "New pre-order collections are currently being scheduled."}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/shop" className="px-6 py-3 rounded-full text-xs font-bold text-white btn-primary-gradient">
              Browse All Products
            </Link>
            <Link href="/offer" className="px-6 py-3 rounded-full text-xs font-bold text-navy-700 border border-slate-300 hover:bg-slate-50">
              Check Offers
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <Link
            href={href(current - 1)}
            aria-disabled={current <= 1}
            className={`px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-colors ${
              current <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-slate-50 text-slate-700"
            }`}
          >
            Previous
          </Link>
          <span className="text-xs font-bold text-slate-600 px-3">
            Page {current} of {totalPages}
          </span>
          <Link
            href={href(current + 1)}
            aria-disabled={current >= totalPages}
            className={`px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-colors ${
              current >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-slate-50 text-slate-700"
            }`}
          >
            Next
          </Link>
        </div>
      )}

      {/* How Pre-Order Works */}
      <section className="mt-16 rounded-3xl bg-gradient-to-br from-slate-50 to-violet-50/50 border border-slate-200/80 p-6 sm:p-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-violet-700">Transparency & Trust</span>
          <h2 className="text-2xl sm:text-3xl font-black text-navy-700 mt-1">How Pre-Order Works</h2>
          <p className="text-sm text-slate-500 mt-2">
            We source fresh authentic inventory directly from global manufacturers. Here is our fulfilment process:
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200/70 shadow-xs">
            <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 font-black text-sm flex items-center justify-center mb-4">
              1
            </span>
            <h3 className="font-extrabold text-navy-700 text-base mb-2">Place Your Pre-Order</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Order your favorite item before regular stock arrives. No stock limitation or sold-out barrier.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200/70 shadow-xs">
            <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 font-black text-sm flex items-center justify-center mb-4">
              2
            </span>
            <h3 className="font-extrabold text-navy-700 text-base mb-2">Direct Air Cargo & Custom Clearance</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Stock is dispatched from UK/USA distributors, packed, and flown in with promised 15–30 days window.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200/70 shadow-xs">
            <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 font-black text-sm flex items-center justify-center mb-4">
              3
            </span>
            <h3 className="font-extrabold text-navy-700 text-base mb-2">Doorstep Delivery & Cash On Delivery</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track progress online at any step. Receive your fresh authentic product right at your address.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
