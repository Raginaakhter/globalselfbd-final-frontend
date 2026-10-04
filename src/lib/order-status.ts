// Order status flow as enforced by the backend:
// PENDING → CONFIRMED → PROCESSING → READY_TO_SHIP → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
// (shortcuts PROCESSING → SHIPPED and SHIPPED → DELIVERED are still allowed),
// with CANCELLED reachable from PENDING, CONFIRMED, PROCESSING or READY_TO_SHIP. Single source for labels and ordering.
import type { OrderStatus } from "@/lib/backend-types";

export type { OrderStatus };

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

/** The happy path, in order. Cancelled is rendered separately rather than as a timeline step. */
export const ORDER_STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Statuses in which a customer may still cancel their own order. */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING"];

/** Statuses from which an admin may cancel. */
export const ADMIN_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "READY_TO_SHIP"];

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

/** Index of a status within the happy-path flow, or -1 for cancelled / unknown statuses. */
export function orderStatusFlowIndex(status: string): number {
  return ORDER_STATUS_FLOW.indexOf(status as OrderStatus);
}

/** "24 Oct 2026" style date, or "" when missing. */
export function formatShortDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}
