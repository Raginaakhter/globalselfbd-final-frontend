"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, PanelLeft, ShieldX } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { useDashboardAccess } from "./store/AdminStore";
import { MODULES, moduleForPath, requiresEdit } from "./store/permissions";
import { ConfirmProvider, Spinner } from "./ui";
import "./dashboard.css";

function PermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { ready, roleName, levelOf } = useDashboardAccess();
  const mod = moduleForPath(pathname);

  if (!ready) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white">
        <Spinner label="Checking access permissions..." />
      </div>
    );
  }
  if (!mod) return <>{children}</>;

  const level = levelOf(mod.key);
  const blocked = level === "none" || (requiresEdit(pathname) && level !== "edit");

  if (blocked) {
    const firstAllowed = MODULES.find((m) => levelOf(m.key) !== "none");
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-2xs">
        <div className="rounded-full bg-rose-50 p-4 text-rose-500">
          <ShieldX className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Access Denied</h1>
        <p className="max-w-sm text-sm text-slate-500">
          Your role (<b>{roleName}</b>) {level === "view" ? "has view-only access to" : "does not have access to"} <b>{mod.title}</b>. Ask an Admin to
          update your role permissions.
        </p>
        {firstAllowed && (
          <Link href={firstAllowed.path} className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Go to {firstAllowed.title}
          </Link>
        )}
      </div>
    );
  }

  // Pages hide the actions a role cannot take, so no separate view-only notice is shown.
  return <>{children}</>;
}

/** The dashboard is for staff. Customers (empty backend menu) go to their own orders on the storefront. */
function StaffOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, isStaff } = useDashboardAccess();
  const isCustomer = ready && !isStaff;

  useEffect(() => {
    if (isCustomer) router.replace("/profile?tab=orders");
  }, [isCustomer, router]);

  if (!ready || isCustomer) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        {isCustomer ? (
          <>
            <p className="text-sm font-semibold text-slate-700">The admin dashboard is for staff only.</p>
            <p className="text-xs text-slate-500">Taking you to your orders and account…</p>
            <Link href="/profile?tab=orders" className="text-xs font-semibold text-blue-600 hover:underline">
              Go to My Orders
            </Link>
          </>
        ) : (
          <p className="text-xs text-slate-500">Loading your session…</p>
        )}
      </div>
    );
  }
  return <>{children}</>;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <StaffOnly>
      <ConfirmProvider>
        <div className="admin-dashboard flex min-h-screen w-full bg-slate-50/50">
          <AppSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
          <main className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden p-4 sm:p-6">
            <div className="mb-4 md:hidden">
              <button
                onClick={() => setMobileOpen(true)}
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Toggle Sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="w-full min-w-0 flex-1">
              <PermissionGate>{children}</PermissionGate>
            </div>
          </main>
        </div>
      </ConfirmProvider>
    </StaffOnly>
  );
}
