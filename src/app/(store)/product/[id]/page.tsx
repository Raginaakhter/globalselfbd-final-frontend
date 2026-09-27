import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleX, ShieldCheck, Truck } from "lucide-react";
import { fetchSite } from "@/lib/site-fetch";
import ProductSection from "@/components/landing/ProductSection";
import PurchasePanel from "@/components/shop/PurchasePanel";
import ProductGallery from "@/components/shop/ProductGallery";
import { fetchProduct, fetchProducts } from "@/lib/server/storefront";
import { packLabel } from "@/lib/storefront";
import { formatPrice } from "@/lib/shop";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(decodeURIComponent(id));
  if (!product) return { title: "Product not found | Global Shelf BD" };
  return {
    title: `${product.productTitle} | Global Shelf BD`,
    description: `${product.productTitle} — ${formatPrice(product.finalPrice)}. ${product.productDescription}`.slice(0, 200),
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  // `id` is the product slug (links use /product/<slug>).
  const product = await fetchProduct(decodeURIComponent(id));
  if (!product) notFound();

  const [{ settings, trustBadges }, relatedRes] = await Promise.all([
    fetchSite(),
    product.categoryId ? fetchProducts({ category: product.categoryId._id, limit: 5 }) : Promise.resolve({ products: [] }),
  ]);
  const related = relatedRes.products.filter((p) => p._id !== product._id).slice(0, 4);
  const breadcrumb = product.breadcrumb ?? (product.categoryId ? [product.categoryId] : []);
  const category = breadcrumb[breadcrumb.length - 1];
  const outOfStock = product.availability === "OUT_OF_STOCK";
  const pack = packLabel(product);

  const assurances = [
    { icon: Truck, t: "Fast delivery", s: `${formatPrice(settings.shippingInsideDhaka)} inside Dhaka` },
    ...[
      { icon: ShieldCheck, badge: trustBadges.find((b) => /authentic/i.test(b.title)) },
    ].flatMap(({ icon, badge }) => (badge ? [{ icon, t: badge.title, s: badge.body }] : [])),
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-4 flex flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-brand-700">Shop</Link>
          {breadcrumb.map((c) => (
            <span key={c._id} className="flex items-center gap-1.5">
              <span>/</span>
              <Link href={`/shop?category=${c.slug}`} className="hover:text-brand-700">{c.name}</Link>
            </span>
          ))}
          <span>/</span>
          <span className="font-semibold text-navy-700 line-clamp-1">{product.productTitle}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-8">
          <ProductGallery images={[product.thumbnail, ...product.gallery].filter(Boolean)} alt={product.productTitle} discountPercent={product.discountPercent} />

          <div className="flex flex-col">
            {category && <p className="text-xs font-black uppercase tracking-widest text-brand-700">{category.name}</p>}
            <h1 className="text-2xl sm:text-3xl font-black text-navy-700 tracking-tight leading-tight mt-1.5">{product.productTitle}</h1>
            {pack && <p className="text-sm text-slate-500 mt-1">{pack}</p>}

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-black text-brand-700">{formatPrice(product.finalPrice)}</span>
              {product.discountPercent > 0 && (
                <>
                  <span className="text-lg text-slate-400 line-through">{formatPrice(product.customerSellPrice)}</span>
                  <span className="px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-black">
                    You save {formatPrice(product.customerSellPrice - product.finalPrice)}
                  </span>
                </>
              )}
            </div>

            <p className={`mt-3 inline-flex items-center gap-2 text-sm font-bold ${outOfStock ? "text-rose-600" : "text-brand-700"}`}>
              {outOfStock ? <CircleX className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {outOfStock ? "Out of stock" : "In stock — ready to ship"}
            </p>

            {product.productDescription && <p className="text-sm text-slate-600 leading-relaxed mt-4 whitespace-pre-line">{product.productDescription}</p>}

            <div className="mt-6 pt-6 border-t border-slate-100">
              <PurchasePanel product={product} />
            </div>

            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-xs">
              {assurances.map(({ icon: Icon, t, s }) => (
                <li key={t} className="flex items-center gap-2.5 rounded-2xl bg-brand-50 border border-brand-100 p-3">
                  <Icon className="w-5 h-5 text-brand-700 shrink-0" />
                  <span>
                    <span className="block font-bold text-navy-700">{t}</span>
                    <span className="text-slate-500">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 mt-6">
          <h2 className="text-lg font-black text-navy-700 mb-4">Product details</h2>
          <dl className="text-sm divide-y divide-slate-100">
            {[
              ["Category", breadcrumb.map((c) => c.name).join(" › ") || "—"],
              ...(product.sizes.length ? [["Available sizes", product.sizes.join(", ")]] : []),
              ...(pack ? [["Pack size", pack]] : []),
              ["Availability", outOfStock ? "Out of stock" : "In stock"],
              ["Delivery", `Dhaka ${formatPrice(settings.shippingInsideDhaka)} · Nationwide ${formatPrice(settings.shippingOutsideDhaka)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-semibold text-navy-700 text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <ProductSection id="related" title="You May Also Like" bn="আপনার পছন্দ হতে পারে" products={related} href={category ? `/shop?category=${category.slug}` : "/shop"} />
    </>
  );
}
