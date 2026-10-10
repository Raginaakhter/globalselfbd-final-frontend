"use client";

import React from "react";
import { CalendarClock, CheckCircle2, Circle, PackageCheck, XCircle } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, type OrderStatus, formatShortDate, orderStatusFlowIndex, toCustomerStatus } from "@/lib/order-status";

const STEP_ICONS: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  // All intermediate backend statuses collapse to "Confirmed" in the UI.
  PENDING: CheckCircle2,
  CONFIRMED: CheckCircle2,
  PROCESSING: CheckCircle2,
  READY_TO_SHIP: CheckCircle2,
  SHIPPED: CheckCircle2,
  OUT_FOR_DELIVERY: CheckCircle2,
  DELIVERED: PackageCheck,
  CANCELLED: XCircle,
};

export type StatusTimestamps = Partial<Record<OrderStatus, string | null | undefined>>;

export default function StatusTimeline({
  status,
  timestamps,
  cancellationReason,
}: {
  status: string;
  /** When each step happened (optional; shown under the step label). */
  timestamps?: StatusTimestamps;
  cancellationReason?: string | null;
}) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700">
        <XCircle className="w-6 h-6 shrink-0" />
        <div>
          <p className="font-black">Order Cancelled</p>
          <p className="text-sm text-rose-600/80">
            {cancellationReason ? `Reason: ${cancellationReason}` : "This order has been cancelled."}
            {timestamps?.CANCELLED ? ` · ${formatShortDate(timestamps.CANCELLED)}` : ""}
          </p>
        </div>
      </div>
    );
  }

  const activeIndex = Math.max(orderStatusFlowIndex(status), 0);

  return (
    <div className="flex items-start justify-between gap-1 sm:gap-2 overflow-x-auto pb-1">
      {ORDER_STATUS_FLOW.map((step, i) => {
        const done = i <= activeIndex;
        const Icon = STEP_ICONS[step];
        const at = timestamps?.[step];
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center text-center flex-1 min-w-[52px]">
              <span
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 text-slate-300"
                } ${i === activeIndex ? "ring-4 ring-blue-900/15" : ""}`}
              >
                {done ? <Icon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Circle className="w-4 h-4 sm:w-5 sm:h-5" />}
              </span>
              <span className={`mt-2 text-[10px] sm:text-xs font-bold leading-tight ${done ? "text-blue-950" : "text-slate-400"}`}>
                {ORDER_STATUS_LABELS[step]}
              </span>
              {at && <span className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400">{formatShortDate(at)}</span>}
            </div>
            {i < ORDER_STATUS_FLOW.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-2 mt-4.5 sm:mt-[22px] rounded-full ${i < activeIndex ? "bg-blue-900" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const simple = toCustomerStatus(status);
  const tone =
    simple === "CANCELLED"
      ? "bg-rose-50 text-rose-600"
      : simple === "DELIVERED"
      ? "bg-blue-50 text-blue-800"
      : "bg-emerald-50 text-emerald-700";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${tone}`}>
      {ORDER_STATUS_LABELS[simple]}
    </span>
  );
}

/** Small "Pre-Order" chip used on order rows, product cards and items. */
export function PreOrderBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-0.5 text-[10px] font-black tracking-wide text-white uppercase shadow-sm ${className}`}
    >
      <CalendarClock className="h-3 w-3" /> Pre-Order
    </span>
  );
}

/** Banner explaining the pre-order delivery window. */
export function PreOrderNotice({ minDays, expectedDeliveryDate, className = "" }: { minDays?: number; expectedDeliveryDate?: string | null; className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 text-violet-900 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
        <CalendarClock className="h-5 w-5" />
      </span>
      <div className="text-sm">
        <p className="font-black">Pre-Order</p>
        <p className="text-violet-800/80">
          {expectedDeliveryDate ? (
            <>
              Expected delivery by <b>{formatShortDate(expectedDeliveryDate)}</b>
              {minDays ? ` (about ${minDays} days)` : ""}.
            </>
          ) : minDays ? (
            <>Ships within about {minDays} days of ordering.</>
          ) : (
            <>This order contains pre-order items.</>
          )}
        </p>
      </div>
    </div>
  );
}
