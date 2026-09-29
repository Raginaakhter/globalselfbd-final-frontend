"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CirclePlus, Clock, FolderPlus, RefreshCw, ShoppingBag } from "lucide-react";
import { BASE } from "./AppSidebar";
import { useDashboardAccess } from "./store/AdminStore";
import type { AccessLevel, ModuleKey } from "./store/permissions";

// `needs` is the access level the current role must have on `module` for the shortcut to show.
const quickActions: { label: string; href: string; icon: typeof CirclePlus; className: string; module: ModuleKey; needs: AccessLevel }[] = [
  { label: "+ Add Product", href: `${BASE}/products/add`, icon: CirclePlus, className: "bg-blue-600 hover:bg-blue-700", module: "products", needs: "edit" },
  { label: "+ Add Category", href: `${BASE}/categories`, icon: FolderPlus, className: "bg-violet-600 hover:bg-violet-700", module: "categories", needs: "edit" },
  { label: "View Orders", href: `${BASE}/orders`, icon: ShoppingBag, className: "bg-blue-800 hover:bg-blue-900", module: "orders", needs: "view" },
  ];

interface Props {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isFetching: boolean;
}

export default function DashboardHeader({
  lastUpdated,
  onRefresh,
  isFetching,
}: Props) {
  const [now, setNow] = useState("");
  const { levelOf } = useDashboardAccess();
  const allowedActions = quickActions.filter((a) => {
    const level = levelOf(a.module);
    return a.needs === "view" ? level !== "none" : level === "edit";
  });

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Business Overview
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              <span>Current Time:</span>
              <span className="font-semibold text-slate-700">{now || "Loading time..."}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>Last Updated:</span>
              <span className="font-semibold text-slate-700">
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  : "Just now"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isFetching}
            title="Refresh Dashboard Data"
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3">
        <span className="mr-1 text-xs font-bold tracking-wider text-slate-400 uppercase">Quick Actions:</span>
        {allowedActions.length === 0 && <span className="text-xs text-slate-400">No actions available for your role.</span>}
        {allowedActions.map(({ label, href, icon: Icon, className }) => (
          <Link
            key={label}
            href={href}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition ${className}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>

    </div>
  );
}
