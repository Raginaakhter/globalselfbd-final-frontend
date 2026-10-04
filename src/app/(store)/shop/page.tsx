import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { fetchSite } from "@/lib/site-fetch";
import ProductCard from "@/components/landing/ProductCard";
import CategoryIcon from "@/components/shop/CategoryIcon";
import StoreSearchBar from "@/components/shop/StoreSearchBar";
import { fetchProducts } from "@/lib/server/storefront";
import { flattenCategories, type StoreCategory } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Shop All Products | Global Shelf BD",
  description: "Browse authentic vitamins, skin care, baby, grocery and more at Global Shelf BD.",
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

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const category = first(sp.category);
  const sort = (sorts.find((s) => s.key === first(sp.sort))?.key ?? "newest") as SortKey;
  const page = Math.max(parseInt(first(sp.page), 10) || 1, 1);

  const { categories } = await fetchSite();
  // URLs use the category slug; the API filters by category ID (sub-categories included).
  const flat = flattenCategories(categories);
  const activeCategory = flat.find((c) => c.slug === category);

  const { products: list, pagination, error } = await fetchProducts({
    search: q,
    category: activeCategory?._id,
    sort,
    page,
    limit: PAGE_SIZE,
  });
  const total = pagination?.total ?? list.length;

  const href = (next: { category?: string; sort?: string; page?: number }) => {
    const params = new URLSearchParams();
    const c = next.category !== undefined ? next.category : category;
    const s = next.sort !== undefined ? next.sort : sort;
    if (q) params.set("q", q);
    if (c) params.set("category", c);
    if (s && s !== "newest") params.set("sort", s);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const title = q ? `Results for "${q}"` : activeCategory ? activeCategory.name : "All Products";

  const categoryLink = (c: StoreCategory, depth: number) => (
    <li key={c._id} className="shrink-0">
      <Link
        href={href({ category: c.slug })}
        style={{ paddingLeft: 12 + depth * 14 }}
        className={`flex items-center gap-2.5 pr-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
          activeCategory?._id === c._id ? "bg-brand-600 text-white" : "text-navy-700 hover:bg-brand-50"
        }`}
      >
        <CategoryIcon category={c} className="w-6 h-6 rounded-md text-[11px]" /> {c.name}
      </Link>
    </li>
  );
  const renderTree = (nodes: StoreCategory[], depth = 0): React.ReactNode[] =>
    nodes.flatMap((c) => [categoryLink(c, depth), ...renderTree(c.children ?? [], depth + 1)]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <span className="font-semibold text-navy-700">{title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 lg:sticky lg:top-40">
            <h2 className="text-sm font-black text-navy-700 uppercase tracking-wider mb-3">Categories</h2>
            <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-1 lg:pb-0">
              <li className="shrink-0">
                <Link
                  href={href({ category: "" })}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                    !activeCategory ? "bg-brand-600 text-white" : "text-navy-700 hover:bg-brand-50"
                  }`}
                >
                  <span>🛍️</span> All products
                </Link>
              </li>
              <li className="shrink-0">
                <Link
                  href="/pre-order"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200"
                >
                  <span>📦</span> Pre-Orders
                </Link>
              </li>
              {renderTree(categories)}
            </ul>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <div className="mb-5">
            <StoreSearchBar placeholder="Search by name, brand or keyword (e.g. honey, lotion, vitamin)..." />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy-700 tracking-tight">{title}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {total} {total === 1 ? "product" : "products"} found
              </p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
              {sorts.map((s) => (
                <Link
                  key={s.key}
                  href={href({ sort: s.key })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                    sort === s.key ? "bg-navy-700 text-white border-navy-700" : "bg-white text-navy-700 border-slate-200 hover:border-brand-400"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm font-semibold text-rose-700">Could not load products: {error}</p>
          ) : list.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200 py-20 text-center px-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 flex items-center justify-center mb-4">
                <SearchX className="w-9 h-9 text-brand-600" />
              </div>
              <h2 className="text-xl font-black text-navy-700">No products found</h2>
              <p className="text-sm text-slate-500 mt-1 mb-5">Try a different keyword or browse all categories.</p>
              <Link href="/shop" className="inline-block px-6 py-3 rounded-full text-sm font-bold text-white btn-primary-gradient">
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {list.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {pagination && pagination.totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-3 text-sm font-bold" aria-label="Pagination">
                  {page > 1 && (
                    <Link href={href({ page: page - 1 })} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-navy-700 hover:border-brand-400">
                      ← Previous
                    </Link>
                  )}
                  <span className="text-slate-500">
                    Page {page} of {pagination.totalPages}
                  </span>
                  {page < pagination.totalPages && (
                    <Link href={href({ page: page + 1 })} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-navy-700 hover:border-brand-400">
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
