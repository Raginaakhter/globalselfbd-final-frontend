"use client";

import { useSite } from "@/context/SiteContext";

export default function TrustBar() {
  const { trustBadges } = useSite();
  if (trustBadges.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5">
        {trustBadges.map((b) => (
          <div key={b.title} className="flex items-center gap-3">
            <span className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-xl sm:text-2xl">
              {b.emoji}
            </span>
            <div>
              <h3 className="text-sm font-bold text-navy-700 leading-tight">{b.title}</h3>
              <p className="text-xs text-slate-500 leading-snug mt-0.5 hidden sm:block">{b.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
