"use client";
import { LOGO_URL } from "@/lib/brand";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardAccess } from "./store/AdminStore";
import { BASE, MODULES } from "./store/permissions";

export { BASE };

type NavItem = { title: string; url: string; icon: LucideIcon };

const ACTIVE_BG = "#2D6FF8";
const ACTIVE_FG = "#FFFFFF";
const TEXT = "#4B5563";
const ICON = "#6B7280";

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.url}
      onClick={onNavigate}
      className="flex h-9 items-center gap-3 rounded-xl px-4 font-semibold transition-colors duration-150 hover:bg-slate-100"
      style={active ? { backgroundColor: ACTIVE_BG, color: ACTIVE_FG } : { color: TEXT }}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" style={{ color: active ? ACTIVE_FG : ICON }} />
      <span className="truncate text-[14px] font-[500]">{item.title}</span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, menu, user } = useAuth();
  const { ready, roleName, levelOf } = useDashboardAccess();
  // Sidebar labels come from the backend menu where it lists the page.
  const toItem = (m: (typeof MODULES)[number]): NavItem => ({
    title: menu.find((i) => i.key === m.menuKey)?.label ?? m.title,
    url: m.path,
    icon: m.icon,
  });
  const visible = MODULES.filter((m) => ready && levelOf(m.key) !== "none");
  const mainItems = visible.filter((m) => m.section === "main").map(toItem);
  const bottomItems = visible.filter((m) => m.section === "bottom").map(toItem);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="overflow-y-auto pr-1">
        <Link href="/" onClick={onNavigate}>
          <div className="flex items-center gap-2 px-4">
            <Image src={LOGO_URL} alt="Global Shelf BD" width={200} height={50} className="h-[50px] w-auto object-contain" style={{ width: "auto" }} priority />
          </div>
          <p className="border-b px-[50px] pb-2 text-[9px] text-[#A7B2C3]">Enterprise Ecommerce Admin</p>
        </Link>

        <nav className="mt-3 flex flex-col gap-1 p-2">
          {mainItems.map((item) => (
            <NavLink key={item.title} item={item} active={pathname === item.url || (item.url !== BASE && !!pathname?.startsWith(`${item.url}/`))} onNavigate={onNavigate} />
          ))}


          {bottomItems.map((item) => (
            <NavLink key={item.title} item={item} active={pathname === item.url || (item.url !== BASE && !!pathname?.startsWith(`${item.url}/`))} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      <div className="mt-2 space-y-2 border-t border-gray-100 pt-3">
        <div className="mx-4 flex items-center justify-between gap-2 text-[11px]">
          <span className="min-w-0 truncate font-semibold text-slate-500" title={user?.email}>
            {user?.name}
          </span>
          <span className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-extrabold text-blue-700 uppercase">{roleName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="mx-4 flex w-[calc(100%-2rem)] cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#EF4444] hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}

export default function AppSidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  return (
    <>
      {/* Desktop: fixed 16rem rail with a spacer keeping content clear of it */}
      <div className="hidden w-64 shrink-0 md:block" />
      <aside className="fixed inset-y-0 left-0 z-10 hidden h-svh w-64 border-r bg-white pr-2 md:flex md:flex-col">
        <SidebarBody />
      </aside>

      {/* Mobile: off-canvas sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white pr-2 shadow-xl">
            <button
              onClick={onMobileClose}
              className="absolute top-3 right-3 cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarBody onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
