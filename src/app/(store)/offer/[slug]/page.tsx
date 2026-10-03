import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Flame, SearchX } from "lucide-react";
import ProductCard from "@/components/landing/ProductCard";
import StoreSearchBar from "@/components/shop/StoreSearchBar";
import { fetchOffer } from "@/lib/server/storefront";
import { formatPrice } from "@/lib/shop";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const offer = await fetchOffer(slug);
  if (!offer) return { title: "Offer not found | Global Shelf BD" };
  return {
    title: `${offer.title} | Global Shelf BD`,
    description: offer.description || `${offer.title} — limited-time deals at Global Shelf BD.`,
    openGraph: offer.bannerImage ? { images: [offer.bannerImage] } : undefined,
  };
}

export default async function OfferDetailPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const offer = await fetchOffer(slug);
  if (!offer) notFound();

  const q = first(sp.q).trim();
  const queryLower = q.toLowerCase();
  const words = queryLower.split(/\s+/).filter(Boolean);

  const filteredProducts = (offer.products ?? []).filter((p) => {
    if (!words.length) return true;
    const title = (p.productTitle || "").toLowerCase();
    const desc = (p.productDescription || "").toLowerCase();
    const slugName = (p.slug || "").toLowerCase();
    const catName = (p.categoryId?.name || "").toLowerCase();
    return words.every((w) => title.includes(w) || desc.includes(w) || slugName.includes(w) || catName.includes(w));
  });

  const discount = offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% OFF` : `${formatPrice(offer.discountValue)} OFF`;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <Link href="/offer" className="hover:text-brand-700">Offers</Link>
        <span>/</span>
        <span className="font-semibold text-navy-700 line-clamp-1">{offer.title}</span>
      </nav>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 text-white mb-6 shadow-lg">
        {offer.bannerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.bannerImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        )}
        <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-12 max-w-2xl">
          {offer.badgeLabel && (
            <span className="inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow" style={{ backgroundColor: offer.badgeColor || "rgba(255,255,255,.2)" }}>
              {offer.badgeLabel}
            </span>
          )}
          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight mt-3">{offer.title}</h1>
          <p className="mt-2 text-3xl sm:text-5xl font-black drop-shadow">{discount}</p>
          {offer.description && <p className="text-sm sm:text-base text-white/90 mt-2">{offer.description}</p>}
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-bold">
            <CalendarClock className="h-3.5 w-3.5" /> {fmt(offer.startsAt)} – {fmt(offer.endsAt)}
            {offer.minOrderValue ? ` · Min order ${formatPrice(offer.minOrderValue)}` : ""}
          </p>
        </div>
        <Flame className="hidden sm:block absolute -right-6 -bottom-8 w-48 h-48 text-white/10" />
      </section>

      {offer.products.length > 0 && (
        <div className="mb-6">
          <StoreSearchBar placeholder={`Search products in ${offer.title} (e.g. honey, oil, cream)...`} />
        </div>
      )}

      {q && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-xs font-semibold text-slate-500">
            Found <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "product" : "products"} for: <strong className="text-navy-700">&ldquo;{q}&rdquo;</strong>
          </span>
          <Link href={`/offer/${offer.slug}`} className="text-xs font-bold text-brand-600 hover:underline">
            Clear search
          </Link>
        </div>
      )}

      {offer.products.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 py-20 text-center px-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <SearchX className="w-9 h-9 text-brand-600" />
          </div>
          <h2 className="text-xl font-black text-navy-700">No products in this offer right now</h2>
          <Link href="/offer" className="mt-5 inline-block px-6 py-3 rounded-full text-sm font-bold text-white btn-primary-gradient">
            See all offers
          </Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 py-20 text-center px-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <SearchX className="w-9 h-9 text-brand-600" />
          </div>
          <h2 className="text-xl font-black text-navy-700">No matching products found</h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">No products in this offer match &ldquo;{q}&rdquo;.</p>
          <Link href={`/offer/${offer.slug}`} className="inline-block px-6 py-3 rounded-full text-sm font-bold text-white btn-primary-gradient">
            Clear search
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
