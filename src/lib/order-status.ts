// The storefront collapses the pipeline to just three visible states:
// CONFIRMED → DELIVERED, with CANCELLED as a bail-out. Any backend status
// other than DELIVERED or CANCELLED is shown as CONFIRMED to the customer.
// Backend accepts the full flow for compatibility; the UI exposes only this
// simplified set in filters, mutation dropdowns and badges.
import type { OrderStatus } from "@/lib/backend-types";

export type { OrderStatus };

export const ORDER_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "DELIVERED",
  "CANCELLED",
];

/** Simplified happy path shown to the user. Cancelled is rendered separately. */
export const ORDER_STATUS_FLOW: OrderStatus[] = ["CONFIRMED", "DELIVERED"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Confirmed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Confirmed",
  READY_TO_SHIP: "Confirmed",
  SHIPPED: "Confirmed",
  OUT_FOR_DELIVERY: "Confirmed",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Collapses any backend status to one of the three visible states. */
export function toCustomerStatus(status: string): "CONFIRMED" | "DELIVERED" | "CANCELLED" {
  if (status === "DELIVERED") return "DELIVERED";
  if (status === "CANCELLED") return "CANCELLED";
  return "CONFIRMED";
}

/** Statuses in which a customer may still cancel their own order. */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING"];

/** Statuses from which an admin may cancel. */
export const ADMIN_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "READY_TO_SHIP"];

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

/** Index of a status within the happy-path flow, or -1 for cancelled / unknown statuses. */
export function orderStatusFlowIndex(status: string): number {
  return ORDER_STATUS_FLOW.indexOf(toCustomerStatus(status) as OrderStatus);
}

/** "24 Oct 2026" style date, or "" when missing. */
export function formatShortDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}
