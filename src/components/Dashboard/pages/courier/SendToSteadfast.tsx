"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TruckElectric, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError, useAuth } from "@/context/AuthContext";
import type { AdminOrder, CourierBookingResponse } from "@/lib/backend-types";
import { formatBDT } from "../../format";
import {
  FieldError,
  Modal,
  PrimaryButton,
  inputClass,
  labelClass,
} from "../../ui";
import { COURIER_BASE } from "./shared";

/**
 * Button + confirmation modal that books a parcel with Steadfast for the given order.
 * Only renders when the order is CONFIRMED, delivery method is MANUAL, and no
 * active courier shipment is linked yet. Uses an idempotency key so repeat clicks
 * cannot create duplicate parcels.
 */
export default function SendToSteadfast({
  order,
  onBooked,
}: {
  order: AdminOrder;
  onBooked?: () => void;
}) {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);

  const canBook = hasPermission("courier.book");
  const hasShipment = Boolean(
    (order as unknown as { courierShipmentId?: string | null }).courierShipmentId
  );
  const deliveryMethod = (order as unknown as { deliveryMethod?: "MANUAL" | "STEADFAST" }).deliveryMethod ?? "MANUAL";
  const eligible = order.orderStatus === "CONFIRMED" && deliveryMethod === "MANUAL" && !hasShipment;

  if (!canBook || !eligible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
      >
        <TruckElectric className="h-4 w-4" /> Send to Steadfast
      </button>
      <Modal open={open} onClose={() => setOpen(false)} className="max-w-xl rounded-2xl">
        {open && (
          <SendForm
            order={order}
            onClose={() => setOpen(false)}
            onBooked={() => {
              setOpen(false);
              onBooked?.();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function SendForm({ order, onClose, onBooked }: { order: AdminOrder; onClose: () => void; onBooked: () => void }) {
  const { api } = useAuth();
  const router = useRouter();
  const ship = order.shippingInformation;
  const customerPhone = (ship.phone || "").replace(/[\s-]/g, "");
  const [name, setName] = useState(ship.name || "");
  const [phone, setPhone] = useState(customerPhone);
  const [altPhone, setAltPhone] = useState("");
  const [address, setAddress] = useState([ship.address, ship.area, ship.city].filter(Boolean).join(", "));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Same key must be sent across retries so the backend can dedupe.
  const idempotencyKey = useRef(cryptoRandomId()).current;

  const codAmount = useMemo(() => {
    const paid = (order as unknown as { paidAmount?: number }).paidAmount ?? 0;
    return Math.max(0, order.totalAmount - paid);
  }, [order]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Recipient name is required.");
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) return setError("Enter a valid Bangladeshi phone number.");
    if (address.trim().length < 10) return setError("Delivery address looks too short.");
    setError("");
    setBusy(true);
    try {
      const res = await api<CourierBookingResponse>("/admin/courier/shipments", {
        method: "POST",
        body: JSON.stringify({
          orderId: order._id,
          idempotencyKey,
          recipientName: name.trim(),
          recipientPhone: phone,
          alternativePhone: altPhone.trim() || undefined,
          recipientAddress: address.trim(),
          note: note.trim() || undefined,
        }),
      });
      const data = res.data;
      if (data.bookingStatus === "SUCCESS") {
        toast.success(res.message || "Booked with Steadfast");
        router.push(`${COURIER_BASE}/shipments/${data._id}`);
      } else if (data.bookingStatus === "UNCERTAIN") {
        toast.warning("Steadfast did not confirm. Check their portal before retrying.");
        router.push(`${COURIER_BASE}/shipments/${data._id}`);
      } else {
        toast.error(data.bookingFailureReason || "Steadfast rejected the booking.");
      }
      onBooked();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to send to Steadfast.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">Send to Steadfast Courier</h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
          <p className="mb-2 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
            Order {order.orderNumber}
          </p>
          <ul className="divide-y divide-slate-200 text-slate-700">
            {order.items.map((it) => (
              <li key={it._id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="truncate font-semibold">
                  {it.productTitleSnapshot}
                  {it.selectedSize && <span className="ml-1 text-slate-500">({it.selectedSize})</span>}
                  <span className="ml-2 text-slate-500">× {it.quantity}</span>
                </span>
                <span className="font-semibold">{formatBDT(it.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-0.5 border-t border-slate-200 pt-2 text-slate-700">
            <div className="flex justify-between"><span className="text-slate-500">Order total</span><span className="font-bold">{formatBDT(order.totalAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Advance paid</span><span>{formatBDT((order as unknown as { paidAmount?: number }).paidAmount ?? 0)}</span></div>
            <div className="flex justify-between text-blue-800">
              <span className="font-bold">COD to collect</span>
              <span className="font-extrabold">{formatBDT(codAmount)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Recipient name *</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Recipient phone *</span>
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Alternative phone</span>
            <input className={inputClass} value={altPhone} onChange={(e) => setAltPhone(e.target.value)} placeholder="Optional backup number" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Delivery address *</span>
            <textarea className={inputClass} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Delivery note</span>
            <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Handle with care" />
          </label>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Booking is final — a parcel will be created in Steadfast. If the request times out, the shipment is marked
          <b> Uncertain</b> for you to verify before any retry (so no duplicate parcel is created).
        </p>
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 p-4">
        <FieldError message={error} />
        <button type="button" onClick={onClose} disabled={busy} className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50">
          Cancel
        </button>
        <PrimaryButton type="submit" loading={busy}>
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…</> : "Confirm & Book"}
        </PrimaryButton>
      </footer>
    </form>
  );
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cour-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
