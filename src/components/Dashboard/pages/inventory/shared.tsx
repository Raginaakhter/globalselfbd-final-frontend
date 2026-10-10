"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  Factory,
  LayoutDashboard,
  LucideIcon,
  PackageOpen,
  PackageSearch,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import type { ShipmentStatus, StockMovementType, StockRequestStatus, StockStatus } from "@/lib/backend-types";
import { BASE } from "../../store/permissions";

export const INVENTORY_BASE = `${BASE}/inventory`;

export interface InventoryTab {
  key: string;
  title: string;
  path: string;
  icon: LucideIcon;
  /** When set, hide this tab unless the user has at least one of these permissions. */
  anyPermission?: string[];
}

export const INVENTORY_TABS: InventoryTab[] = [
  { key: "overview", title: "Overview", path: INVENTORY_BASE, icon: LayoutDashboard, anyPermission: ["inventory.view"] },
  { key: "products", title: "Products", path: `${INVENTORY_BASE}/products`, icon: Boxes, anyPermission: ["inventory.view"] },
  { key: "shipments", title: "Shipments", path: `${INVENTORY_BASE}/shipments`, icon: Truck, anyPermission: ["shipments.view"] },
  { key: "suppliers", title: "Suppliers", path: `${INVENTORY_BASE}/suppliers`, icon: Factory, anyPermission: ["suppliers.view"] },
  { key: "movements", title: "Stock Movements", path: `${INVENTORY_BASE}/movements`, icon: ClipboardList, anyPermission: ["inventory.view"] },
  { key: "low-stock", title: "Low Stock", path: `${INVENTORY_BASE}/low-stock`, icon: AlertTriangle, anyPermission: ["inventory.view"] },
  { key: "out-of-stock", title: "Out of Stock", path: `${INVENTORY_BASE}/out-of-stock`, icon: PackageOpen, anyPermission: ["inventory.view"] },
  { key: "stock-requests", title: "Stock Requests", path: `${INVENTORY_BASE}/stock-requests`, icon: PackageSearch, anyPermission: ["stockRequests.view", "inventory.view"] },
  { key: "profit", title: "Profit & Loss", path: `${INVENTORY_BASE}/profit`, icon: TrendingUp, anyPermission: ["inventory.view"] },
  { key: "valuation", title: "Inventory Value", path: `${INVENTORY_BASE}/valuation`, icon: Wallet, anyPermission: ["inventory.view"] },
  { key: "reports", title: "Reports", path: `${INVENTORY_BASE}/reports`, icon: BarChart3, anyPermission: ["inventory.view"] },
];

/** Sub-nav for the inventory module. */
export function InventoryTabs({ visibleTabs }: { visibleTabs: InventoryTab[] }) {
  const pathname = usePathname() ?? "";
  return (
    <div className="flex w-full snap-x gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
      {visibleTabs.map((t) => {
        const Icon = t.icon;
        const active =
          pathname === t.path ||
          (t.path !== INVENTORY_BASE && pathname.startsWith(`${t.path}/`));
        return (
          <Link
            key={t.key}
            href={t.path}
            className={`flex shrink-0 snap-start items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              active ? "bg-blue-800 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.title}
          </Link>
        );
      })}
    </div>
  );
}

const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
};

const STOCK_STATUS_CLASS: Record<StockStatus, string> = {
  IN_STOCK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOW_STOCK: "bg-amber-50 text-amber-700 border-amber-200",
  OUT_OF_STOCK: "bg-rose-50 text-rose-700 border-rose-200",
};

export function StockStatusBadge({ value }: { value: StockStatus }) {
  return (
    <span
      className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap uppercase ${STOCK_STATUS_CLASS[value]}`}
    >
      {STOCK_STATUS_LABEL[value]}
    </span>
  );
}

const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  PENDING: "Pending",
  IN_TRANSIT: "In transit",
  PARTIALLY_RECEIVED: "Partially received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

const SHIPMENT_STATUS_CLASS: Record<ShipmentStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600 border-slate-200",
  IN_TRANSIT: "bg-sky-50 text-sky-700 border-sky-200",
  PARTIALLY_RECEIVED: "bg-amber-50 text-amber-700 border-amber-200",
  RECEIVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export function ShipmentStatusBadge({ value }: { value: ShipmentStatus }) {
  return (
    <span
      className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap uppercase ${SHIPMENT_STATUS_CLASS[value]}`}
    >
      {SHIPMENT_STATUS_LABEL[value]}
    </span>
  );
}

const REQUEST_STATUS_CLASS: Record<StockRequestStatus, string> = {
  NEW: "bg-sky-50 text-sky-700 border-sky-200",
  NOTIFIED: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

export function StockRequestStatusBadge({ value }: { value: StockRequestStatus }) {
  return (
    <span
      className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap uppercase ${REQUEST_STATUS_CLASS[value]}`}
    >
      {value}
    </span>
  );
}

const MOVEMENT_CLASS: Record<string, string> = {
  PURCHASE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SALE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  RESERVATION: "bg-sky-50 text-sky-700 border-sky-200",
  RELEASE: "bg-slate-100 text-slate-600 border-slate-200",
  RETURN: "bg-cyan-50 text-cyan-700 border-cyan-200",
  DAMAGE: "bg-rose-50 text-rose-700 border-rose-200",
  LOSS: "bg-rose-50 text-rose-700 border-rose-200",
  ADJUSTMENT_IN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ADJUSTMENT_OUT: "bg-amber-50 text-amber-700 border-amber-200",
  MANUAL_STOCK_UPDATE: "bg-violet-50 text-violet-700 border-violet-200",
  EXPIRY: "bg-orange-50 text-orange-700 border-orange-200",
  INTERNAL_USE: "bg-slate-100 text-slate-600 border-slate-200",
};

export function MovementTypeBadge({ value }: { value: StockMovementType }) {
  return (
    <span
      className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap uppercase ${
        MOVEMENT_CLASS[value] ?? "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

/** Nicely format a signed stock delta. */
export function signedQty(type: StockMovementType, qty: number) {
  const positive: StockMovementType[] = [
    "PURCHASE",
    "RETURN",
    "ADJUSTMENT_IN",
    "RELEASE",
  ];
  const negative: StockMovementType[] = [
    "SALE",
    "RESERVATION",
    "DAMAGE",
    "LOSS",
    "ADJUSTMENT_OUT",
    "EXPIRY",
    "INTERNAL_USE",
  ];
  if (positive.includes(type)) return `+${qty}`;
  if (negative.includes(type)) return `-${qty}`;
  return String(qty);
}
