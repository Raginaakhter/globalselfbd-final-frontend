import type { Metadata } from "next";
import { fetchSite } from "@/lib/site-fetch";
import ContactDetailsBlock from "@/components/legal/ContactDetailsBlock";
import ContactForm from "@/components/legal/ContactForm";
import { Globe, Ship, Store, Handshake, Package, Leaf } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Global Shelf BD",
  description: "Get in touch with Global Shelf BD for product, order, or business & partnership enquiries.",
};

const PARTNERSHIPS = [
  { icon: Globe, label: "International Suppliers & Brands" },
  { icon: Ship, label: "Import Partners" },
  { icon: Store, label: "Retailers & Distributors" },
  { icon: Handshake, label: "B2B Customers" },
  { icon: Package, label: "Wholesale Buyers" },
  { icon: Leaf, label: "Organic & Sustainable Product Businesses" },
];

export default async function ContactPage() {
  const { settings } = await fetchSite();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-800">We&apos;d Love to Hear From You</h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Have a question about a product, an order, our services, or a potential business opportunity? The {settings.siteName} team is here to
          help.
        </p>
        <p className="mt-2 text-slate-600 leading-relaxed">
          Whether you are a customer looking for an authentic international product, a supplier interested in working with us, or a business
          partner exploring import, retail, or distribution opportunities, we would be happy to hear from you.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-navy-800 mb-3">Get in Touch</h2>
            <ContactDetailsBlock settings={settings} />
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
            <h3 className="text-sm font-bold text-navy-800 mb-2">Customer Support</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              For product inquiries, order-related questions, delivery information, or general assistance, please contact our customer support team
              using the details above, or track an order any time from the{" "}
              <a href="/track-order" className="text-brand-700 font-semibold hover:underline">Track Order</a> page.
            </p>
          </div>

          <div className="rounded-2xl bg-brand-50/60 border border-brand-100 p-5 sm:p-6">
            <h3 className="text-sm font-bold text-navy-800 mb-1">Business & Partnership Inquiries</h3>
            <p className="text-xs text-slate-600 mb-3">
              Interested in becoming a supplier, distributor, retailer, or business partner? We welcome opportunities to work with:
            </p>
            <ul className="space-y-2">
              {PARTNERSHIPS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm font-semibold text-navy-800">
                  <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-brand-700" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              Please contact us with your business details and requirements. Our team will get back to you as soon as possible.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy-800 mb-3">Send Us a Message</h2>
          <p className="text-sm text-slate-500 mb-4">
            Have a question or need assistance? Fill out the form below and our team will respond as soon as possible.
          </p>
          <ContactForm />
        </div>
      </div>

      <div className="text-center mt-16 pt-10 border-t border-slate-200">
        <p className="text-slate-700 font-medium">Your trust matters to us. Your questions matter too.</p>
        <p className="mt-3 font-bold text-navy-800">{settings.siteName}</p>
        <p className="text-sm text-slate-500">Global Products. Authentic Choice.</p>
        <p className="text-sm text-slate-500">From the World, For Your Home. 🌍🏠</p>
      </div>
    </div>
  );
}
