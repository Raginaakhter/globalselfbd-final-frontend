"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Heart, BadgePercent, CalendarClock, X } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { useCategorySidebar } from "@/context/CategorySidebarContext";
import CategoryIcon from "@/components/shop/CategoryIcon";
import type { StoreCategory } from "@/lib/storefront";

// Sits comfortably below the sticky header on every breakpoint:
// mobile = TopBar(36) + Header row(72) + mobile search(~48) + gap
// md    = TopBar(36) + Header row(72)                        + gap  (no mobile search, no nav strip)
// lg    = TopBar(36) + Header row(80) + nav strip(44)        + gap
// xl    = TopBar(36) + Header row(88) + nav strip(44)        + gap
// Panel uses `fixed … bottom-0` so it stretches to the viewport bottom.
const PANEL_TOP = "top-44 md:top-32 lg:top-44 xl:top-48";

export default function CategorySidebar() {
  const { categories, navLinks } = useSite();
  const { open, closeSidebar } = useCategorySidebar();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Bottom section: just the About Us group (the parent plus its policy/contact children).
  const aboutGroup = navLinks.find((l) => l.label.toLowerCase().includes("about"));
  const aboutLinks: { label: string; href: string }[] = aboutGroup
    ? [{ label: aboutGroup.label, href: aboutGroup.href }, ...(aboutGroup.children ?? [])]
    : [];

  // Close on Escape; lock body scroll on small screens where the drawer covers content.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSidebar();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeSidebar]);

  return (
    <>
      {/* Backdrop: dims the page on tablet/mobile; clicking closes the drawer */}
      <div
        aria-hidden={!open}
        onClick={closeSidebar}
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        id="category-sidebar"
        aria-label="Shop by category"
        aria-hidden={!open}
        className={`fixed left-0 bottom-0 ${PANEL_TOP} z-50 w-[82vw] max-w-[320px] lg:w-72 xl:w-80 bg-white border-r border-slate-200 shadow-xl overflow-y-auto overscroll-contain transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile-only close button so users can dismiss the drawer without the backdrop */}
        <button
          type="button"
          aria-label="Close category sidebar"
          onClick={closeSidebar}
          className="lg:hidden absolute right-2 top-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-slate-600 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Quick links */}
        <nav className="px-2 pt-3 pb-2 grid grid-cols-3 gap-1.5">
          <QuickLink href="/pre-order" label="Pre-Order" tone="bg-purple-100 text-purple-700" icon={<CalendarClock className="w-4 h-4" />} onClick={closeSidebar} />
          <QuickLink href="/offer" label="Offers" tone="bg-blue-100 text-blue-700" icon={<BadgePercent className="w-4 h-4" />} onClick={closeSidebar} />
          <QuickLink href="/wishlist" label="Favourites" tone="bg-rose-100 text-rose-600" icon={<Heart className="w-4 h-4 fill-current" />} onClick={closeSidebar} />
        </nav>

        <div className="h-px bg-slate-100 mx-3" />

        {/* Category list */}
        <ul className="px-2 py-2">
          {categories.map((cat) => (
            <CategoryRow
              key={cat._id}
              category={cat}
              expanded={expanded === cat._id}
              onToggle={() => setExpanded((cur) => (cur === cat._id ? null : cat._id))}
              onNavigate={closeSidebar}
            />
          ))}
          {categories.length === 0 && (
            <li className="px-3 py-6 text-sm text-slate-500">No categories yet.</li>
          )}
        </ul>

        {/* About Us group — the About page itself plus its policy/contact children */}
        {aboutLinks.length > 0 && (
          <>
            <div className="h-px bg-slate-100 mx-3" />
            <ul className="px-2 py-2 pb-6">
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={closeSidebar}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </>
  );
}

function QuickLink({
  href,
  label,
  tone,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  tone: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
    >
      <span className={`w-7 h-7 rounded-md flex items-center justify-center ${tone}`}>{icon}</span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
    </Link>
  );
}

function CategoryRow({
  category,
  expanded,
  onToggle,
  onNavigate,
}: {
  category: StoreCategory;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const hasChildren = (category.children?.length ?? 0) > 0;

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={`/shop?category=${category.slug}`}
          onClick={onNavigate}
          className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors min-w-0"
        >
          <CategoryIcon category={category} className="w-7 h-7 rounded-md text-xs" />
          <span className="text-sm font-semibold text-slate-800 truncate">{category.name}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={expanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
            aria-expanded={expanded}
            onClick={onToggle}
            className="p-2 mr-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="pl-10 pr-2 pb-1">
          {category.children!.map((sub) => (
            <li key={sub._id}>
              <Link
                href={`/shop?category=${sub.slug}`}
                onClick={onNavigate}
                className="block py-1.5 px-2 rounded text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              >
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

