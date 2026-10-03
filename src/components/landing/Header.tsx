"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import CategoryIcon from "@/components/shop/CategoryIcon";
import { ChevronDown, Search, ShoppingCart, User as UserIcon, Menu, X, LayoutGrid, Package, Heart } from "lucide-react";
import Logo from "./Logo";
import { useSite } from "@/context/SiteContext";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const { categories, navLinks } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  // Active on its own page and on pages under it ("/shop" stays active on "/shop?q=...").
  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
  };
  const { count, openDrawer } = useCart();
  const { count: wishlistCount } = useWishlist();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setMenuOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <header className="sticky top-9 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm text-slate-800">
      {/* Main row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 lg:h-20 xl:h-22 flex items-center gap-2 sm:gap-3 lg:gap-6">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="shrink-0">
          <Logo compact />
        </div>

        {/* Search */}
        <form
          role="search"
          onSubmit={submitSearch}
          className="hidden md:flex flex-1 min-w-0 max-w-md lg:max-w-lg xl:max-w-2xl mx-auto items-center rounded-full border-2 border-blue-900 bg-blue-900 overflow-hidden transition-all focus-within:ring-4 focus-within:ring-blue-900/15"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vitamins, skin care, baby, grocery…"
            aria-label="Search products"
            className="flex-1 px-5 py-2 text-sm outline-none bg-transparent placeholder:text-blue-100 text-white"
          />
          <button
            type="submit"
            aria-label="Search"
            className="m-1 px-4 py-1.5 rounded-full bg-white text-blue-900 hover:bg-blue-50 text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="hidden xl:inline">Search</span>
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          <Link
            href="/track-order"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Track Order</span>
          </Link>

          {isAuthenticated ? (
            <>
              {user?.role === "admin" && (
                <Link
                  href="/admin-dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user?.name?.split(" ")[0] || "Account"}</span>
              </Link>
            </>
          ) : (
            <Link href="/register" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 transition-colors">
              <UserIcon className="w-4 h-4" />
              <span>Register</span>
            </Link>
          )}

          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishlistCount} items`}
            className="relative p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-coral-500 text-white text-[11px] font-black flex items-center justify-center">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label={`Open cart, ${count} items`}
            onClick={openDrawer}
            className="relative p-2.5 rounded-full bg-blue-900 text-white hover:bg-blue-800 transition-colors cursor-pointer shadow-sm"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-sun-400 text-blue-950 text-[11px] font-black flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={submitSearch} role="search" className="md:hidden px-3 pb-3">
        <div className="flex items-center rounded-full border-2 border-blue-900 bg-blue-900 overflow-hidden">
          <Search className="w-4 h-4 ml-4 text-blue-100 shrink-0" />
          <input type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" aria-label="Search products" className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent text-white placeholder:text-blue-100" />
        </div>
      </form>

      {/* Desktop nav strip */}
      <nav className="hidden lg:block border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center gap-1 relative">
          <div className="relative" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
            <button
              type="button"
              aria-expanded={catOpen}
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-2 h-11 px-4 bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" /> Shop By Category
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full w-140 bg-white rounded-b-2xl border border-slate-200 shadow-2xl p-3 grid grid-cols-2 gap-1">
                {categories.map((c) => (
                  <Link key={c._id} href={`/shop?category=${c.slug}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors">
                    <CategoryIcon category={c} />
                    <span className="text-sm font-semibold text-blue-950">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {navLinks.map((l) => {
            // Any child link active also lights up the parent (e.g. About Us stays highlighted on /privacy-policy)
            const active = isActive(l.href) || (l.children ?? []).some((c) => isActive(c.href));
            const item = (
              <span
                aria-current={active ? "page" : undefined}
                className={`group relative px-4 h-11 flex items-center gap-1 text-sm font-semibold transition-colors duration-200 ${
                  active
                    ? "text-blue-900 bg-blue-50"
                    : l.hot
                      ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      : "text-slate-700 hover:text-blue-900 hover:bg-blue-50/70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-900 transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
                {l.hot && <span className="mr-1.5">🔥</span>}
                {l.label}
                {l.children && <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />}
              </span>
            );

            if (l.children) {
              return (
                // group triggers the CSS-only dropdown; clicking the label still goes to the parent page
                <div key={l.label} className="relative group">
                  <Link href={l.href} aria-haspopup="menu">{item}</Link>
                  <div className="absolute left-0 top-full min-w-56 rounded-b-2xl border border-slate-200 bg-white shadow-2xl p-2 z-30 opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 transition">
                    {l.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        aria-current={isActive(c.href) ? "page" : undefined}
                        className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                          isActive(c.href) ? "text-blue-900 bg-blue-50" : "text-slate-700 hover:text-blue-900 hover:bg-blue-50/70"
                        }`}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return <Link key={l.label} href={l.href}>{item}</Link>;
          })}
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            {categories.map((c) => (
              <Link key={c._id} href={`/shop?category=${c.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-brand-50">
                <CategoryIcon category={c} className="w-8 h-8 rounded-lg text-xs" />
                <span className="text-xs font-semibold text-navy-700 leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
          <div className="px-4 pb-4 flex flex-col">
            {navLinks.map((l) => (
              <div key={l.label} className="border-t border-slate-100">
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`block py-2.5 px-3 text-sm font-semibold transition-colors ${
                    isActive(l.href) ? "text-blue-900 bg-blue-50 border-l-4 border-l-blue-900" : "text-navy-700 hover:text-blue-900 hover:bg-blue-50/70"
                  }`}
                >
                  {l.label}
                </Link>
                {l.children && (
                  // Child links show as an indented list under the parent so the whole menu is scannable in one tap
                  <div className="pl-6 pb-1">
                    {l.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive(c.href) ? "page" : undefined}
                        className={`block py-2 px-3 text-xs font-semibold transition-colors ${
                          isActive(c.href) ? "text-blue-900 bg-blue-50" : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/70"
                        }`}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
