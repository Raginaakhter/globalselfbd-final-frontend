import Link from "next/link";
import { ArrowRight, Globe, ShoppingBag, ShieldCheck } from "lucide-react";

const BLOCKS = [
  {
    icon: Globe,
    label: "Who We Are",
    title: "A Global Trading & E-Commerce Company",
    body: "Global Shelf BD is a Bangladesh-based Importer, Retailer, and Online Shopping Platform, connecting Bangladesh with quality products and opportunities from around the world.",
  },
  {
    icon: ShoppingBag,
    label: "What We Do",
    title: "Import • Retail • Online Shopping",
    body: "We source, import and retail a diverse range of products, serving both B2B and B2C customers through trusted global sourcing and convenient digital commerce.",
  },
  {
    icon: ShieldCheck,
    label: "Why We Do It",
    title: "Because Trust Matters.",
    body: "We believe everyone deserves access to authentic products, reliable service, and transparent information. Our mission is to build a trusted bridge between global markets and Bangladeshi consumers and businesses.",
  },
];

export default function AboutIntro() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="grid md:grid-cols-3 gap-4">
        {BLOCKS.map(({ icon: Icon, label, title, body }) => (
          <div key={label} className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
            <span className="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-brand-700" />
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{label}</p>
            <h3 className="mt-1 text-lg font-black text-navy-700 tracking-tight">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <p className="font-bold text-navy-700">From the World, For Your Home.</p>
        <p className="text-sm text-slate-500">Global Products. Authentic Choice.</p>
        <Link href="/about" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800 group">
          Learn more about us
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
