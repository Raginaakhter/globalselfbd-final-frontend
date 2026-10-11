"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LucideIcon,
  Truck,
} from "lucide-react";
import type {
  CourierBookingStatus,
  CourierDeliveryStatus,
  CourierSettlementStatus,
  DeliveryMethod,
} from "@/lib/backend-types";
import { BASE } from "../../store/permissions";

export const COURIER_BASE = `${BASE}/courier`;

export interface CourierTab {
  key: string;
  title: string;
  path: string;
  icon: LucideIcon;
  anyPermission?: string[];
}

// Phase 1 tabs only. Returns, Reports and Settings arrive in later phases.
export const COURIER_TABS: CourierTab[] = [
  { key: "overview", title: "Overview", path: COURIER_BASE, icon: LayoutDashboard, anyPermission: ["courier.view"] },
  { key: "shipments", title: "Shipments", path: `${COURIER_BASE}/shipments`, icon: Truck, anyPermission: ["courier.view"] },
];

export function CourierTabs({ visibleTabs }: { visibleTabs: CourierTab[] }) {
  const pathname = usePathname() ?? "";
  return (
    <div className="flex w-full snap-x gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
      {visibleTabs.map((t) => {
        const Icon = t.icon;
        const active =
          pathname === t.path ||
          (t.path !== COURIER_BASE && pathname.startsWith(`${t.path}/`));
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

/* ---------- Status chips ---------- */

const BOOKING_LABEL: Record<CourierBookingStatus, string> = {
  IN_PROGRESS: "In progress",
  SUCCESS: "Booked",
  FAILED: "Failed",
  UNCERTAIN: "Uncertain — verify",
};

const BOOKING_CLASS: Record<CourierBookingStatus, string> = {
  IN_PROGRESS: "bg-slate-100 text-slate-600 border-slate-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  UNCERTAIN: "bg-amber-50 text-amber-700 border-amber-200",
};

export function BookingStatusBadge({ value }: { value: CourierBookingStatus }) {
  return (
    <span className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap uppercase ${BOOKING_CLASS[value]}`}>
      {BOOKING_LABEL[value]}
    </span>
  );
}

// Delivery status mapping — approval-pending variants intentionally use amber,
// never green/red, per the spec. "Verify before trusting."
const DELIVERY_LABEL: Record<CourierDeliveryStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  hold: "On hold",
  delivered: "Delivered",
  partial_delivered: "Partial delivered",
  cancelled: "Cancelled",
  exceptional: "Exceptional",
  unknown: "Unknown",
  delivered_approval_pending: "Delivered · pending approval",
  partial_delivered_approval_pending: "Partial · pending approval",
  cancelled_approval_pending: "Cancelled · pending approval",
  unknown_approval_pending: "Unknown · pending approval",
};

const DELIVERY_CLASS: Record<CourierDeliveryStatus, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  in_review: "bg-sky-50 text-sky-700 border-sky-200",
  hold: "bg-amber-50 text-amber-700 border-amber-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial_delivered: "bg-teal-50 text-teal-700 border-teal-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  exceptional: "bg-orange-50 text-orange-700 border-orange-200",
  unknown: "bg-purple-50 text-purple-700 border-purple-200",
  delivered_approval_pending: "bg-amber-50 text-amber-700 border-amber-200",
  partial_delivered_approval_pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled_approval_pending: "bg-amber-50 text-amber-700 border-amber-200",
  unknown_approval_pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export function DeliveryStatusBadge({ value }: { value: CourierDeliveryStatus }) {
  const label = DELIVERY_LABEL[value] ?? value;
  const cls = DELIVERY_CLASS[value] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap uppercase ${cls}`}>
      {label}
    </span>
  );
}

const SETTLEMENT_LABEL: Record<CourierSettlementStatus, string> = {
  PENDING: "Pending",
  PARTIALLY_SETTLED: "Partially settled",
  SETTLED: "Settled",
  UNDER_RECONCILIATION: "Reconciling",
  DISPUTED: "Disputed",
};

const SETTLEMENT_CLASS: Record<CourierSettlementStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600 border-slate-200",
  PARTIALLY_SETTLED: "bg-amber-50 text-amber-700 border-amber-200",
  SETTLED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UNDER_RECONCILIATION: "bg-sky-50 text-sky-700 border-sky-200",
  DISPUTED: "bg-rose-50 text-rose-700 border-rose-200",
};

export function SettlementStatusBadge({ value }: { value: CourierSettlementStatus }) {
  return (
    <span className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap uppercase ${SETTLEMENT_CLASS[value]}`}>
      {SETTLEMENT_LABEL[value]}
    </span>
  );
}

export function DeliveryMethodBadge({ value }: { value: DeliveryMethod }) {
  const steadfast = value === "STEADFAST";
  return (
    <span className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap uppercase ${
      steadfast
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-slate-100 text-slate-600 border-slate-200"
    }`}>
      {steadfast ? "Steadfast" : "Manual"}
    </span>
  );
}

/* ---------- Formatters ---------- */

export function formatDateTime(value?: string | null) {
  return value
    ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
}
