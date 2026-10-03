"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function PromoBanner() {
  const { promoBanner: p } = useSite();
  if (!p) return null;

  return (
    <section id="clearance" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-32">
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-700 via-navy-600 to-brand-700 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 w-56 h-56 rounded-full bg-brand-400/20 blur-2xl animate-pulse-light" />
        <span className="shine-sweep" />
        <div className="absolute right-0 bottom-0 text-[6rem] sm:text-[10rem] leading-none opacity-15 select-none animate-float" style={{ animationDuration: "6s" }}>🎁</div>
        <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-5 sm:gap-6 px-5 sm:px-12 py-7 sm:py-10">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-sun-400 text-navy-800 text-[11px] font-black uppercase tracking-widest mb-3">
              {p.badge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
              {p.title} <span className="text-sun-400">{p.highlight}</span>
            </h2>
            <p className="text-sm sm:text-base text-white/80 mt-2 max-w-xl">
              {p.body}
              {p.bn && <span className="block mt-1 text-white/90 font-medium">{p.bn}</span>}
            </p>
          </div>
          <Link
            href={p.href}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-navy-700 font-black text-sm shadow-lg hover:bg-sun-400 hover:-translate-y-0.5 transition-all"
          >
            {p.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
