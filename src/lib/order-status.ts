// The storefront collapses the backend pipeline to four visible states:
//   PENDING  → awaiting admin confirmation (new order, no email yet)
//   CONFIRMED → admin confirmed (email + invoice fired by backend)
//   DELIVERED → final success
//   CANCELLED → final failure, rendered as a bail-out
// Any backend intermediate (PROCESSING / READY_TO_SHIP / SHIPPED / OUT_FOR_DELIVERY)
// still displays as CONFIRMED to the customer.
import type { OrderStatus } from "@/lib/backend-types";

export type { OrderStatus };

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "DELIVERED",
  "CANCELLED",
];

/** Visible happy path. Cancelled is rendered separately as a bail-out. */
export const ORDER_STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Confirmed",
  READY_TO_SHIP: "Confirmed",
  SHIPPED: "Confirmed",
  OUT_FOR_DELIVERY: "Confirmed",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Collapses any backend status to one of the four visible states. */
export function toCustomerStatus(status: string): "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED" {
  if (status === "DELIVERED") return "DELIVERED";
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "PENDING") return "PENDING";
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
