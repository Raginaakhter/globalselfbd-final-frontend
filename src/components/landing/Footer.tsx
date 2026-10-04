"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { useSite } from "@/context/SiteContext";
import { useCategorySidebar } from "@/context/CategorySidebarContext";

function socialBrandClass(label: string) {
  const k = label.toLowerCase();
  if (k.includes("facebook")) return "bg-[#1877F2] text-white";
  if (k.includes("instagram")) return "text-white bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]";
  if (k.includes("twitter") || k === "x") return "bg-black text-white";
  if (k.includes("youtube")) return "bg-[#FF0000] text-white";
  if (k.includes("linkedin")) return "bg-[#0A66C2] text-white";
  return "bg-white/10 text-white";
}

function socialIcon(label: string) {
  const k = label.toLowerCase();
  const cls = "w-4 h-4 fill-current";
  if (k.includes("facebook")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
        <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.7V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.6H7.6V14h2.8v8h3.1z" />
      </svg>
    );
  }
  if (k.includes("instagram")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.9.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.9.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.9-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.9-.7 1.4-.9.4-.2 1.1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2M12 0C8.7 0 8.3 0 7.1.1 5.8.1 4.9.3 4.1.6c-.8.3-1.5.8-2.2 1.4C1.3 2.7.8 3.4.5 4.2c-.3.8-.5 1.7-.6 3C-.1 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.3 2.2.6 2.9.3.8.8 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.7.5 3 .6C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c1.3-.1 2.2-.3 2.9-.6.8-.3 1.5-.8 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.7.6-3 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.3-2.2-.6-2.9-.3-.8-.8-1.5-1.4-2.2C21.3 1.3 20.6.8 19.8.5c-.8-.3-1.7-.5-3-.6C15.7 0 15.3 0 12 0zm0 5.8c-3.4 0-6.2 2.8-6.2 6.2s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2S15.4 5.8 12 5.8zM12 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm6.4-11.8c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4-.6-1.4-1.4-1.4z" />
      </svg>
    );
  }
  if (k.includes("twitter") || k === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (k.includes("youtube")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
        <path d="M23.5 6.2c-.3-1-1.1-1.8-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5c-1 .3-1.8 1.1-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1.1 1.8 2.1 2.1 1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
      </svg>
    );
  }
  if (k.includes("linkedin")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.3a1.8 1.8 0 110-3.5 1.8 1.8 0 010 3.5zM19 19h-3v-4.7c0-1.1 0-2.6-1.6-2.6s-1.9 1.3-1.9 2.5V19h-3v-9h2.9v1.3h.1a3.2 3.2 0 012.9-1.6c3.1 0 3.7 2 3.7 4.7z" />
      </svg>
    );
  }
  return <span className="text-xs font-black">{label[0]}</span>;
}

export default function Footer() {
  const { settings, footerColumns, footerLogoUrl, copyrightText } = useSite();
  const { email, phone, whatsapp, address, socials, tagline, complaintTitle, complaintNote } = settings;
  // Shift the footer right on desktop so the fixed sidebar never covers it.
  const { open: sidebarOpen } = useCategorySidebar();

  return (
    <footer
      id="contact"
      className={`mt-16 bg-navy-800 text-white scroll-mt-32 transition-[padding] duration-300 ease-out ${
        sidebarOpen ? "lg:pl-72 xl:pl-80" : "lg:pl-0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)_1.1fr]">
          <div>
            {footerLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={footerLogoUrl} alt={settings.siteName} className="h-12 w-auto max-w-[200px] object-contain" />
            ) : (
              <Logo light />
            )}
            {tagline && <p className="text-sm text-white/65 leading-relaxed mt-4 max-w-xs">{tagline}</p>}
            {(socials.length > 0 || whatsapp) && (
              <div className="flex gap-2.5 mt-5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className={`w-10 h-10 rounded-full ${socialBrandClass(s.label)} flex items-center justify-center transition-transform hover:scale-110`}
                  >
                    {socialIcon(s.label)}
                  </a>
                ))}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center transition-transform hover:scale-110"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {footerColumns.map((col) => (
            <div key={`${col.title}-${col.links.length}`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-400 mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={`${l.label}-${l.href}`}>
                    <Link href={l.href} className="text-sm text-white/70 hover:text-white hover:translate-x-0.5 inline-block transition-all">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-400 mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white break-all">{email}</a>
                </li>
              )}
              {phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">{phone}</a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                  <span>{address}</span>
                </li>
              )}
            </ul>
            {(complaintTitle || complaintNote) && (
              <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4">
                {complaintTitle && <p className="text-sm font-bold">{complaintTitle}</p>}
                {complaintNote && <p className="text-xs text-white/60 mt-1">{complaintNote}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>{copyrightText || `© ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`}</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-white">Refund Policy</Link>
            <Link href="/shipping-policy" className="hover:text-white">Shipping Policy</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
