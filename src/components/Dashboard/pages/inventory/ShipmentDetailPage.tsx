"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, PackageCheck, Pencil, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Shipment } from "@/lib/backend-types";
import { useApiAction, useApiQuery } from "../../api";
import { formatBDT, formatShortDate } from "../../format";
import {
  ErrorBox,
  FieldError,
  Modal,
  PageHeader,
  PrimaryButton,
  Spinner,
  inputClass,
  labelClass,
  useConfirm,
} from "../../ui";
import { INVENTORY_BASE, ShipmentStatusBadge } from "./shared";
import ShipmentForm from "./ShipmentForm";

type DialogState = null | "edit" | "receive";

export default function ShipmentDetailPage({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const detail = useApiQuery<Shipment>(`/admin/inventory/shipments/${shipmentId}`);
  const [dialog, setDialog] = useState<DialogState>(null);

  if (detail.loading && !detail.data) return <Spinner label="Loading shipment..." />;
  if (detail.error) return <ErrorBox message={detail.error} onRetry={detail.reload} />;
  if (!detail.data) return null;

  const s = detail.data;
  const canEdit = hasPermission("shipments.update") && (s.status === "PENDING" || s.status === "IN_TRANSIT" || s.status === "PARTIALLY_RECEIVED");
  const canReceive = hasPermission("shipments.receive") && s.status !== "RECEIVED" && s.status !== "CANCELLED";
  const canDelete = hasPermission("shipments.delete") && s.status !== "CANCELLED";

  const supplierName = typeof s.supplierId === "object" ? s.supplierId?.name ?? "—" : "—";

  const remove = async () => {
    const ok = await confirm({
      title: `Cancel shipment ${s.shipmentNumber}?`,
      text: "Any received stock from lots with no sales will be reversed. This cannot be undone.",
      confirmText: "Yes, Cancel Shipment",
    });
    if (!ok) return;
    const res = await action(`/admin/inventory/shipments/${s._id}`, { method: "DELETE" });
    if (res) router.push(`${INVENTORY_BASE}/shipments`);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <Link href={`${INVENTORY_BASE}/shipments`} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to shipments
      </Link>

      <PageHeader title={`Shipment ${s.shipmentNumber}`} subtitle={`Supplier: ${supplierName} · ${formatShortDate(s.shipmentDate)}`}>
        <ShipmentStatusBadge value={s.status} />
        {canEdit && (
          <button
            type="button"
            onClick={() => setDialog("edit")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        )}
        {canReceive && (
          <PrimaryButton onClick={() => setDialog("receive")}>
            <PackageCheck className="mr-2 h-4 w-4" /> Receive stock
          </PrimaryButton>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <Trash className="h-4 w-4" /> Cancel shipment
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Expected" value={s.expectedDate ? formatShortDate(s.expectedDate) : "—"} />
        <Stat label="Received" value={s.receivedDate ? formatShortDate(s.receivedDate) : "—"} />
        <Stat label="Items" value={String(s.totalProducts ?? s.items.length)} />
        <Stat label="Quantity" value={String(s.totalQuantity ?? s.items.reduce((a, i) => a + i.purchaseQuantity, 0))} />
        <Stat label="Subtotal" value={formatBDT(s.subtotal)} />
        <Stat label="Shipping" value={formatBDT(s.shippingCost)} />
        <Stat label="Customs + Tax + Other" value={formatBDT(s.customsCost + s.tax + s.otherCost)} />
        <Stat label="Total cost" value={formatBDT(s.totalCost)} highlight />
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <header className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-extrabold text-slate-800">Items</h3>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-5 py-3">Product</th>
                <th className="px-3 py-3 text-right">Purchase qty</th>
                <th className="px-3 py-3 text-right">Received qty</th>
                <th className="px-3 py-3 text-right">Unit cost</th>
                <th className="px-3 py-3 text-right">Landed cost</th>
                <th className="px-3 py-3 text-right">Sell price</th>
                <th className="px-5 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.items.map((it, i) => {
                const prod = typeof it.productId === "object" ? it.productId : null;
                return (
                  <tr key={it._id ?? it.itemId ?? i}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {prod?.thumbnail && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={prod.thumbnail} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                        )}
                        <div className="min-w-0">
                          {prod ? (
                            <Link href={`${INVENTORY_BASE}/products/${prod._id}`} className="text-sm font-bold text-slate-900 hover:underline">
                              {prod.productTitle}
                            </Link>
                          ) : (
                            <span className="text-sm font-bold text-slate-900">—</span>
                          )}
                          {prod?.sku && <div className="font-mono text-[10px] text-slate-500">{prod.sku}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">{it.purchaseQuantity.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-800">{(it.receivedQuantity ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{formatBDT(it.unitCost)}</td>
                    <td className="px-3 py-3 text-right">{it.landedUnitCost != null ? formatBDT(it.landedUnitCost) : "—"}</td>
                    <td className="px-3 py-3 text-right">{it.sellingPrice != null ? formatBDT(it.sellingPrice) : "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{it.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {s.notes && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-800">Notes</h3>
          <p className="mt-1 text-xs text-slate-600">{s.notes}</p>
        </section>
      )}

      <Modal open={dialog === "edit"} onClose={() => setDialog(null)} className="max-w-4xl rounded-2xl">
        {dialog === "edit" && (
          <ShipmentForm
            shipment={s}
            onClose={() => setDialog(null)}
            onSaved={() => {
              setDialog(null);
              detail.reload();
            }}
          />
        )}
      </Modal>

      <Modal open={dialog === "receive"} onClose={() => setDialog(null)} className="max-w-2xl rounded-2xl">
        {dialog === "receive" && (
          <ReceiveForm
            shipment={s}
            onClose={() => setDialog(null)}
            onReceived={() => {
              setDialog(null);
              detail.reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{label}</div>
      <div className={`mt-1 ${highlight ? "text-xl font-extrabold text-slate-900" : "text-sm font-bold text-slate-800"}`}>{value}</div>
    </div>
  );
}

function ReceiveForm({ shipment, onClose, onReceived }: { shipment: Shipment; onClose: () => void; onReceived: () => void }) {
  const action = useApiAction();
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [full, setFull] = useState(true);
  const [items, setItems] = useState<Record<string, string>>(() =>
    Object.fromEntries(shipment.items.map((it) => [it._id ?? it.itemId ?? "", String(Math.max(0, it.purchaseQuantity - (it.receivedQuantity ?? 0)))]))
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { receivedDate };
    if (!full) {
      const line = shipment.items.map((it) => {
        const id = it._id ?? it.itemId ?? "";
        const qty = Number(items[id] || 0);
        return { itemId: id, receivedQuantity: qty };
      }).filter((l) => l.receivedQuantity > 0);
      if (!line.length) return setError("Enter at least one received quantity > 0.");
      payload.items = line;
    }
    setError("");
    setSaving(true);
    const res = await action(`/admin/inventory/shipments/${shipment._id}/receive`, { method: "POST", json: payload });
    setSaving(false);
    if (res) onReceived();
  };

  return (
    <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">Receive {shipment.shipmentNumber}</h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Received date</span>
            <input type="date" className={inputClass} value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            <span>Receive everything that was ordered</span>
            <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} />
          </label>
        </div>

        {!full && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold tracking-wider text-slate-500 uppercase">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Ordered</th>
                  <th className="px-3 py-2 text-right">Already received</th>
                  <th className="px-3 py-2 text-right">Receive now</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipment.items.map((it) => {
                  const id = it._id ?? it.itemId ?? "";
                  const prod = typeof it.productId === "object" ? it.productId : null;
                  const remaining = Math.max(0, it.purchaseQuantity - (it.receivedQuantity ?? 0));
                  return (
                    <tr key={id}>
                      <td className="px-3 py-2 font-semibold text-slate-700">{prod?.productTitle ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{it.purchaseQuantity}</td>
                      <td className="px-3 py-2 text-right">{it.receivedQuantity ?? 0}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          className={`${inputClass} py-1 text-right`}
                          value={items[id] ?? "0"}
                          onChange={(e) => setItems((m) => ({ ...m, [id]: e.target.value }))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 p-4">
        <FieldError message={error} />
        <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
        <PrimaryButton type="submit" loading={saving}>
          <PackageCheck className="mr-2 h-4 w-4" />
          {full ? "Receive everything" : "Receive selected"}
        </PrimaryButton>
      </footer>
    </form>
  );
}
