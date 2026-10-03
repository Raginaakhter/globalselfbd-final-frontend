"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import type { Banner } from "@/lib/backend-types";

const isExternal = (href: string) => /^https?:\/\//i.test(href);

/** Link that opens external URLs in a new tab. */
function BannerLink({ href, className, children, label }: { href: string; className: string; children: React.ReactNode; label?: string }) {
  return isExternal(href) ? (
    <a href={href} target="_blank" rel="noreferrer" className={className} aria-label={label}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

function Slide({ banner, eager }: { banner: Banner; eager: boolean }) {
  const hasText = Boolean(banner.title || banner.subtitle || banner.description || banner.buttonText);
  const alt = banner.altText || banner.title || "Banner";

  const picture = (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-60"
        style={{ backgroundImage: `url("${banner.imageUrl}")` }}
      />
      <picture>
        {banner.mobileImageUrl && <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />}
        <img src={banner.imageUrl} alt={alt} loading={eager ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-contain object-center" />
      </picture>
    </>
  );

  // Image-only banner: the whole slide is the link (when one is set).
  if (!hasText) {
    return banner.buttonLink ? (
      <BannerLink href={banner.buttonLink} className="absolute inset-0 block" label={alt}>
        {picture}
      </BannerLink>
    ) : (
      picture
    );
  }

  return (
    <>
      {picture}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
      <div className="relative h-full flex items-center px-5 sm:px-12 py-6 sm:py-10">
        <div className="max-w-md text-white">
          {banner.subtitle && (
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11px] font-bold uppercase tracking-widest mb-4">{banner.subtitle}</span>
          )}
          {banner.title && <h2 className="text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight mb-3 drop-shadow">{banner.title}</h2>}
          {banner.description && <p className="text-sm sm:text-base text-white/85 leading-relaxed mb-6 max-w-sm">{banner.description}</p>}
          {banner.buttonLink && (
            <BannerLink
              href={banner.buttonLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-navy-700 text-sm font-black shadow-lg hover:bg-sun-400 hover:-translate-y-0.5 transition-all"
            >
              {banner.buttonText || "Shop now"} <ArrowRight className="w-4 h-4" />
            </BannerLink>
          )}
        </div>
      </div>
    </>
  );
}

/** Landing page slider built from the banners managed in the dashboard (GET /api/public/banners). */
export default function Hero() {
  const { banners, promoCards } = useSite();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;
  const active = count ? index % count : 0;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [paused, count]);

  if (count === 0 && promoCards.length === 0) return null;
  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
      <div className={count && promoCards.length ? "grid lg:grid-cols-[1fr_300px] gap-4" : ""}>
      {count > 0 && (
      <div
        className="group relative overflow-hidden rounded-3xl shadow-xl bg-navy-800 aspect-[16/9] lg:aspect-auto lg:min-h-[340px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-roledescription="carousel"
      >
        {banners.map((b, i) => (
          <div
            key={b._id}
            aria-hidden={i !== active}
            className={`absolute inset-0 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
              i === active ? "opacity-100 translate-x-0 scale-100" : "opacity-0 pointer-events-none translate-x-3 scale-[1.02]"
            }`}
          >
            <Slide banner={b} eager={i === 0} />
          </div>
        ))}

        {count > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous slide" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur flex items-center justify-center text-white transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Next slide" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur flex items-center justify-center text-white transition-colors cursor-pointer">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((b, i) => (
                <button
                  key={b._id}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${i === active ? "w-7 bg-white" : "w-2 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      )}

      {promoCards.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 ${count ? "lg:grid-cols-1 lg:auto-rows-fr lg:h-full" : "lg:grid-cols-2"}`}>
          {promoCards.map((b) => (
            <PromoCard key={b._id} banner={b} />
          ))}
        </div>
      )}
      </div>
    </section>
  );
}

/** Small promo card beside the slider (banner with placement PROMO). Text and link are optional. */
function PromoCard({ banner }: { banner: Banner }) {
  const hasText = Boolean(banner.title || banner.subtitle || banner.description || banner.buttonText);
  const alt = banner.altText || banner.title || "Promotion";
  const className = "group relative block overflow-hidden rounded-3xl shadow-lg bg-slate-100 aspect-[16/9] lg:aspect-auto lg:min-h-[160px] lg:h-full hover:-translate-y-1 hover:shadow-xl transition-all duration-300";

  const body = (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-60"
        style={{ backgroundImage: `url("${banner.imageUrl}")` }}
      />
      <picture>
        {banner.mobileImageUrl && <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />}
        <img src={banner.imageUrl} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
      </picture>
      <span className="shine-sweep" />
      {hasText && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-5 sm:p-6 text-white">
            <div>
              {banner.subtitle && <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">{banner.subtitle}</p>}
              {banner.title && <h3 className="text-xl font-black leading-tight drop-shadow">{banner.title}</h3>}
              {banner.description && <p className="text-sm mt-1 max-w-[200px] text-white/85">{banner.description}</p>}
            </div>
            {banner.buttonLink && (
              <span className="inline-flex items-center gap-1.5 text-sm font-black mt-3 transition-transform duration-300 group-hover:translate-x-1">
                {banner.buttonText || "Shop now"} <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </>
      )}
    </>
  );

  return banner.buttonLink ? (
    <BannerLink href={banner.buttonLink} className={className} label={hasText ? undefined : alt}>
      {body}
    </BannerLink>
  ) : (
    <div className={className}>{body}</div>
  );
}
