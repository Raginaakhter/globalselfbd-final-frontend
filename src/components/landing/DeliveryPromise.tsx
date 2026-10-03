"use client";

import { useEffect, useRef, useState } from "react";
import { Truck, Wallet, ShieldCheck, Clock3 } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { formatPrice } from "@/lib/shop";

/** Counts a number up from 0 once the card scrolls into view — runs only once per mount. */
function useCountUp(target: number, active: boolean, duration = 1100) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

/** A real, DB-backed promise card (built from live shipping settings) instead of the app promo
 *  this section used to be — same "card + animation" shape, but grounded in real data rather
 *  than marketing an app that doesn't exist yet. */
export default function DeliveryPromise() {
  const { settings } = useSite();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const insideDhaka = useCountUp(settings.shippingInsideDhaka, inView);
  const outsideDhaka = useCountUp(settings.shippingOutsideDhaka, inView);

  const cards = [
    {
      icon: Truck,
      accent: "from-blue-500 to-blue-800",
      value: `${formatPrice(outsideDhaka)}`,
      label: "Delivery anywhere in Bangladesh, in 3–5 days",
    },
    {
      icon: Clock3,
      accent: "from-sky-400 to-blue-500",
      value: `${formatPrice(insideDhaka)}`,
      label: "Delivery inside Dhaka, in 1–3 days",
    },
    {
      icon: Wallet,
      accent: "from-amber-400 to-orange-500",
      value: "Cash on Delivery",
      label: "Pay when your order arrives",
    },
    {
      icon: ShieldCheck,
      accent: "from-violet-400 to-fuchsia-500",
      value: "100% Authentic",
      label: "Every item sourced from verified suppliers",
    },
  ];

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-10">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-100/60 blur-3xl" />

        <div className="relative mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-navy-700 tracking-tight">Shopping with us, made simple</h2>
        </div>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ icon: Icon, accent, value, label }, i) => (
            <div
              key={label}
              className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 p-5 category-tile ${inView ? "fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <span className="shine-sweep" />
              <span className={`relative inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br ${accent} items-center justify-center shadow-md mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                <Icon className="w-6 h-6 text-white" />
              </span>
              <p className="relative text-lg sm:text-xl font-black text-navy-700 tabular-nums">{value}</p>
              <p className="relative text-xs text-slate-500 mt-1 leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
