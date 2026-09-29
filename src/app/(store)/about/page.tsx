import type { Metadata } from "next";
import Link from "next/link";
import { fetchSite } from "@/lib/site-fetch";
import ContactDetailsBlock from "@/components/legal/ContactDetailsBlock";
import { Globe, ShoppingBag, Leaf, HandHeart, ShieldCheck, Handshake } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Global Shelf BD",
  description: "Our mission, vision and promise — connecting the world through trusted products.",
};

const MISSION_POINTS = [
  { icon: Globe, text: "Connect global markets with Bangladesh through responsible import." },
  { icon: ShieldCheck, text: "Provide authentic and quality products sourced from trusted brands and suppliers." },
  { icon: ShoppingBag, text: "Make global shopping simple and accessible through our online and retail channels." },
  { icon: Handshake, text: "Build long-term relationships with customers, suppliers, brands, and business partners." },
  { icon: Leaf, text: "Encourage better choices by bringing quality, organic, healthy, and responsibly sourced products to consumers." },
  { icon: HandHeart, text: "Put trust, transparency, and customer satisfaction first in everything we do." },
];

const WHAT_WE_DO = [
  { title: "Import", body: "We source and legally import authentic and quality products from trusted suppliers and brands across different countries." },
  { title: "Retail", body: "Through our retail operations, we make carefully selected products available to customers in Bangladesh." },
  { title: "Online Shopping", body: "Our e-commerce platform provides customers with a convenient way to discover, compare, and purchase products from different categories." },
  { title: "B2B & B2C", body: "We serve both business customers and individual consumers, creating opportunities for wholesale, distribution, retail, and online sales." },
  { title: "Authenticity & Quality", body: "We prioritize genuine products, trusted sources, proper product information, and responsible sourcing throughout our operations." },
];

const VISION_POINTS = [
  "Bring global products to Bangladesh.",
  "Build lasting relationships based on trust.",
  "Make quality products easier to access.",
];

export default async function AboutPage() {
  const { settings } = await fetchSite();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Hero */}
      <div className="text-center mb-14">
        <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-widest mb-4">
          Our Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-800">
          Connecting the World Through Trusted Products
        </h1>
        <p className="mt-5 text-slate-700 leading-relaxed max-w-2xl mx-auto">
          At Global Shelf BD, our mission is to make quality products from around the world more accessible to people and businesses in Bangladesh.
        </p>
        <p className="mt-3 text-slate-700 leading-relaxed max-w-2xl mx-auto">
          As an Importer, Retailer, and Online Shopping Platform, we are committed to sourcing authentic products from trusted suppliers,
          maintaining high standards of quality, and providing a convenient, transparent, and reliable shopping experience.
        </p>
      </div>

      {/* We strive to */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-navy-800 mb-5 text-center">We strive to</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {MISSION_POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span className="text-sm text-slate-700 leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Our Promise */}
      <section className="mb-14 rounded-3xl bg-navy-800 text-white p-8 sm:p-10 text-center">
        <h2 className="text-xl font-bold mb-3">Our Promise</h2>
        <p className="text-white/85 leading-relaxed max-w-xl mx-auto">
          We are not here simply to sell products. We are here to build trust, create connections, and make quality products more accessible.
        </p>
        <p className="mt-5 font-semibold text-brand-300">From the World, For Your Home.</p>
      </section>

      {/* Vision */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-navy-800 mb-5 text-center">Our Vision</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {VISION_POINTS.map((v) => (
            <li key={v} className="flex items-center gap-3 rounded-2xl bg-brand-50/60 border border-brand-100 p-4 text-sm font-semibold text-navy-800">
              <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
              {v}
            </li>
          ))}
        </ul>
      </section>

      {/* About Us — What We Are */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-navy-800 mb-3">What We Are: Your Gateway to Global Products</h2>
        <div className="text-slate-700 leading-relaxed space-y-3">
          <p>
            Global Shelf BD is a Bangladesh-based Importer, Retailer, and Online Shopping Platform, connecting customers and businesses
            with quality products from Bangladesh and around the world.
          </p>
          <p>
            We source and trade a diverse range of products, including baby and kids&apos; products, organic and healthy foods, snacks, beauty and
            personal care, lifestyle products, and other consumer goods.
          </p>
          <p>
            Through responsible global sourcing and a customer-focused online shopping experience, we aim to make quality products more accessible,
            convenient, and trustworthy.
          </p>
          <p className="font-semibold text-navy-800">From global sourcing to your doorstep, we make the world more accessible.</p>
        </div>
      </section>

      {/* What We Do */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-navy-800 mb-2">What We Do: We Source. We Import. We Retail. We Deliver.</h2>
        <p className="text-slate-700 leading-relaxed mb-5">
          At Global Shelf BD, we operate across multiple areas of the supply chain to create a reliable connection between international markets,
          suppliers, businesses, and consumers.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {WHAT_WE_DO.map((w) => (
            <div key={w.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-navy-800 mb-1.5">{w.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why We Do It */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-navy-800 mb-3">Why We Do It: Because Trust Should Come Before the Transaction.</h2>
        <div className="text-slate-700 leading-relaxed space-y-3">
          <p>
            In today&apos;s global marketplace, customers have access to products from almost anywhere in the world. But finding authentic products
            from reliable sources can still be difficult.
          </p>
          <p>That is the gap Global Shelf BD wants to address.</p>
          <p>
            We believe customers and businesses deserve access to genuine products, transparent information, dependable service, and fair value.
          </p>
          <p>
            Our purpose is to create a trusted bridge between global suppliers, international markets, Bangladeshi businesses, and everyday
            consumers.
          </p>
          <p>We are building Global Shelf BD not simply as an online shop, but as a growing global trading and e-commerce platform.</p>
        </div>
      </section>

      {/* Closing */}
      <section className="text-center border-t border-slate-200 pt-10">
        <p className="text-lg font-bold text-navy-800">{settings.siteName}</p>
        <p className="text-sm text-slate-500 mt-1">Global Products. Authentic Choice.</p>
        <Link
          href="/contact"
          className="inline-block mt-6 px-7 py-3 rounded-full text-sm font-bold text-white btn-primary-gradient"
        >
          Get in Touch
        </Link>
      </section>

      <div className="mt-14 max-w-md mx-auto">
        <ContactDetailsBlock settings={settings} />
      </div>
    </div>
  );
}
