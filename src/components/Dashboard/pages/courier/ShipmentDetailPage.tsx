"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Copy, Package, Phone, User } from "lucide-react";
import { toast } from "sonner";
import type { CourierShipmentFullResponse } from "@/lib/backend-types";
import { useApiQuery } from "../../api";
import { formatBDT } from "../../format";
import { ErrorBox, PageHeader, Spinner } from "../../ui";
import {
  BookingStatusBadge,
  COURIER_BASE,
  DeliveryStatusBadge,
  SettlementStatusBadge,
  formatDateTime,
} from "./shared";

export default function CourierShipmentDetailPage({ shipmentId }: { shipmentId: string }) {
  const detail = useApiQuery<CourierShipmentFullResponse>(`/admin/courier/shipments/${shipmentId}`);

  if (detail.loading && !detail.data) return <Spinner label="Loading shipment..." />;
  if (detail.error) return <ErrorBox message={detail.error} onRetry={detail.reload} />;
  if (!detail.data) return null;

  const { shipment: s, events, returnRequests, settlements } = detail.data;

  return (
    <div className="flex w-full flex-col gap-6">
      <Link href={`${COURIER_BASE}/shipments`} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to shipments
      </Link>

      <PageHeader
        title={`Shipment · Order ${s.orderNumber}`}
        subtitle={`Booked ${formatDateTime(s.bookingAttemptedAt)}`}
      >
        <BookingStatusBadge value={s.bookingStatus} />
        <DeliveryStatusBadge value={s.deliveryStatus} />
        <SettlementStatusBadge value={s.settlementStatus} />
      </PageHeader>

      {s.bookingStatus === "UNCERTAIN" && (
        <WarningBanner title="Booking outcome uncertain">
          Steadfast did not confirm this booking. Do not retry blindly — a second create request could create a duplicate parcel.
          Check the Steadfast portal for invoice <b>{s.invoice}</b> before trying again.
          {s.bookingFailureReason && <div className="mt-1 text-amber-700">Reason: {s.bookingFailureReason}</div>}
        </WarningBanner>
      )}
      {s.bookingStatus === "FAILED" && s.bookingFailureReason && (
        <WarningBanner title="Booking failed" tone="rose">
          {s.bookingFailureReason}
        </WarningBanner>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 flex flex-col gap-6">
          <Card title="Customer" icon={<User className="h-4 w-4 text-slate-400" />}>
            <Row label="Name" value={s.customerName || "—"} />
            <Row
              label="Phone"
              value={s.customerPhone || "—"}
              action={s.customerPhone ? <CopyButton value={s.customerPhone} /> : null}
            />
            {s.customerAltPhone && (
              <Row label="Alternate phone" value={s.customerAltPhone} action={<CopyButton value={s.customerAltPhone} />} />
            )}
            <Row label="Delivery address" value={s.deliveryAddress || "—"} />
          </Card>

          <Card title={`Items (${s.items.length})`} icon={<Package className="h-4 w-4 text-slate-400" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit price</th>
                    <th className="px-3 py-2 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {s.items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-800">{it.productTitle}</div>
                        {it.variant && <div className="text-[11px] text-slate-500">{it.variant}</div>}
                      </td>
                      <td className="px-3 py-2 text-right">{it.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatBDT(it.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatBDT(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Tracking history">
            {!events.length ? (
              <p className="text-xs text-slate-500">No status events yet. The first event appears right after booking.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Status transition</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((e) => (
                      <tr key={e._id}>
                        <td className="px-3 py-2 text-slate-500">{formatDateTime(e.createdAt)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {e.previousStatus && <DeliveryStatusBadge value={e.previousStatus} />}
                            <span className="text-slate-400">→</span>
                            <DeliveryStatusBadge value={e.newStatus} />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[11px] font-semibold uppercase text-slate-500">{e.source}</td>
                        <td className="px-3 py-2 text-slate-500">{e.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {!!returnRequests.length && (
            <Card title={`Return requests (${returnRequests.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                      <th className="px-3 py-2">Requested</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Parcel received</th>
                      <th className="px-3 py-2">Stock restored</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnRequests.map((r) => (
                      <tr key={r._id}>
                        <td className="px-3 py-2 text-slate-500">{formatDateTime(r.createdAt)}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700">{r.status.replace(/_/g, " ")}</td>
                        <td className="px-3 py-2 text-slate-500">{formatDateTime(r.parcelReceivedAt)}</td>
                        <td className="px-3 py-2 text-slate-500">{formatDateTime(r.stockRestoredAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!!settlements.length && (
            <Card title={`Settlements (${settlements.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                      <th className="px-3 py-2">Received</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Payout / Ref</th>
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {settlements.map((st) => (
                      <tr key={st._id}>
                        <td className="px-3 py-2 text-slate-500">{formatDateTime(st.receivedAt)}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-800">{formatBDT(st.amount)}</td>
                        <td className="px-3 py-2 text-[11px] font-semibold uppercase text-slate-500">{st.source}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                          {st.payoutId || st.reference || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{st.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <Card title="Financials">
            <Row label="Subtotal" value={formatBDT(s.subtotal)} />
            {s.discount > 0 && <Row label="Discount" value={`− ${formatBDT(s.discount)}`} />}
            {s.shippingCost > 0 && <Row label="Shipping" value={formatBDT(s.shippingCost)} />}
            <Row label="Order total" value={formatBDT(s.orderTotal)} bold />
            {s.advancePaid > 0 && <Row label="Advance paid" value={`− ${formatBDT(s.advancePaid)}`} />}
            <Divider />
            <Row label="COD submitted" value={formatBDT(s.codAmountSubmitted)} bold />
            <Row label="COD received" value={formatBDT(s.codAmountReceived)} tone="text-emerald-700" />
            <Row
              label="Outstanding"
              value={formatBDT(s.codOutstanding)}
              bold
              tone={s.codOutstanding > 0 ? "text-rose-700" : "text-slate-500"}
            />
            <Divider />
            <Row label="Configured charge" value={formatBDT(s.configuredCharge)} />
            <Row
              label="Actual charge (verified)"
              value={s.actualCharge == null ? "—" : formatBDT(s.actualCharge)}
              tone="text-slate-600"
            />
          </Card>

          <Card title="Courier identifiers">
            <Row
              label="Consignment ID"
              value={s.consignmentId || "—"}
              action={s.consignmentId ? <CopyButton value={s.consignmentId} /> : null}
            />
            <Row
              label="Tracking code"
              value={s.trackingCode || "—"}
              action={s.trackingCode ? <CopyButton value={s.trackingCode} /> : null}
            />
            <Row label="Courier invoice" value={s.courierInvoice || s.invoice} />
            <Row label="Last synced" value={formatDateTime(s.lastDeliveryStatusSyncedAt)} />
          </Card>

          <Card title="Actions">
            <p className="text-xs text-slate-500">
              Status refresh, cancellation, return, settlement and actual-fee actions are enabled in Phase 2.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        {icon}
        <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
      </header>
      <div className="flex flex-col gap-2 p-5 text-xs">{children}</div>
    </section>
  );
}

function Row({ label, value, bold, tone, action }: { label: string; value: string; bold?: boolean; tone?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`flex items-center gap-2 ${bold ? "font-extrabold" : "font-semibold"} ${tone ?? "text-slate-900"}`}>
        <span>{value}</span>
        {action}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-1 border-t border-dashed border-slate-200" />;
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast.success("Copied");
      setTimeout(() => setDone(false), 1200);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      title="Copy"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function WarningBanner({ title, children, tone = "amber" }: { title: string; children: React.ReactNode; tone?: "amber" | "rose" }) {
  const toneCls =
    tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <div className={`rounded-2xl border p-4 text-sm ${toneCls}`}>
      <p className="font-extrabold">{title}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
