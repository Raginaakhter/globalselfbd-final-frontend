import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Layers, ShieldCheck } from "lucide-react";
import { AddComboButton } from "@/components/shop/ComboCard";
import ProductImage from "@/components/shop/ProductImage";
import { fetchCombo } from "@/lib/server/storefront";
import { formatPrice } from "@/lib/shop";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const combo = await fetchCombo(slug);
  if (!combo) return { title: "Combo not found | Global Shelf BD" };
  return {
    title: `${combo.comboTitle} | Global Shelf BD`,
    description: combo.description || `Save ${combo.discountPercent}% with the ${combo.comboTitle} bundle.`,
    openGraph: combo.thumbnail ? { images: [combo.thumbnail] } : undefined,
  };
}

export default async function ComboDetailPage({ params }: Props) {
  const { slug } = await params;
  const combo = await fetchCombo(slug);
  if (!combo) notFound();

  const images = [combo.thumbnail, ...(combo.gallery ?? [])].filter(Boolean);
  const members = combo.itemDetails ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <Link href="/combo" className="hover:text-brand-700">Combo</Link>
        <span>/</span>
        <span className="font-semibold text-navy-700 line-clamp-1">{combo.comboTitle}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
        <section className="space-y-3">
          <div className="relative aspect-square rounded-3xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
            <ProductImage image={images[0] || members[0]?.thumbnail} alt={combo.comboTitle} />
            {combo.discountPercent > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-coral-500 px-3 py-1.5 text-sm font-black text-white shadow">-{combo.discountPercent}%</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.slice(1, 6).map((src) => (
                <div key={src} className="aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                  <ProductImage image={src} alt={combo.comboTitle} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-indigo-700">
            <Layers className="w-3.5 h-3.5" /> Combo Pack
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black text-navy-700 tracking-tight">{combo.comboTitle}</h1>
          {combo.description && <p className="mt-2 text-sm sm:text-base text-slate-600 whitespace-pre-line">{combo.description}</p>}

          <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-brand-700">{formatPrice(combo.comboPrice)}</span>
              {combo.originalTotal > combo.comboPrice && <span className="text-base text-slate-400 line-through">{formatPrice(combo.originalTotal)}</span>}
            </div>
            {combo.savings > 0 && (
              <p className="mt-1 text-sm font-bold text-emerald-600">
                You save {formatPrice(combo.savings)} ({combo.discountPercent}%)
              </p>
            )}
            {combo.endsAt && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <CalendarClock className="w-3.5 h-3.5" /> Offer ends {new Date(combo.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
            <AddComboButton combo={combo} className="mt-4 w-full sm:w-auto px-8 py-3.5" />
          </div>

          <h2 className="mt-6 mb-3 text-lg font-black text-navy-700">What&apos;s inside ({members.length} items)</h2>
          <ul className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.productId} className="flex items-center gap-3 p-3">
                <Link href={`/product/${m.slug}`} className="h-14 w-14 shrink-0 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center">
                  <ProductImage image={m.thumbnail} alt={m.productTitle} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${m.slug}`} className="text-sm font-bold text-navy-700 hover:text-brand-700 line-clamp-1">
                    {m.productTitle}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {m.quantity} × {formatPrice(m.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-400 line-through">{formatPrice(m.subtotal)}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% authentic products · Cash on delivery available
          </p>
        </section>
      </div>
    </div>
  );
}
