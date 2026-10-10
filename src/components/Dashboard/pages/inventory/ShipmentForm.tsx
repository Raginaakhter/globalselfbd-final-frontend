"use client";

import { useMemo, useState } from "react";
import { Plus, Trash, X } from "lucide-react";
import type { Product, Shipment, Supplier } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery } from "../../api";
import { formatBDT } from "../../format";
import { FieldError, PrimaryButton, inputClass, labelClass, useDebounced } from "../../ui";

interface Draft {
  supplierId: string;
  shipmentDate: string;
  expectedDate: string;
  shippingCost: string;
  customsCost: string;
  tax: string;
  otherCost: string;
  notes: string;
  items: DraftItem[];
}

interface DraftItem {
  key: string;
  productId: string;
  productTitle: string;
  thumbnail?: string;
  purchaseQuantity: string;
  unitCost: string;
  sellingPrice: string;
  notes: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

/** Form for creating a new shipment or editing a pending one. */
export default function ShipmentForm({
  shipment,
  onClose,
  onSaved,
}: {
  shipment?: Shipment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const action = useApiAction();
  const suppliers = useApiQuery<{ suppliers: Supplier[] }>("/admin/inventory/suppliers?status=ACTIVE&limit=200");

  const [draft, setDraft] = useState<Draft>(() => ({
    supplierId: typeof shipment?.supplierId === "object" ? shipment.supplierId?._id ?? "" : (shipment?.supplierId ?? ""),
    shipmentDate: toDateInput(shipment?.shipmentDate) || today(),
    expectedDate: toDateInput(shipment?.expectedDate) || "",
    shippingCost: String(shipment?.shippingCost ?? 0),
    customsCost: String(shipment?.customsCost ?? 0),
    tax: String(shipment?.tax ?? 0),
    otherCost: String(shipment?.otherCost ?? 0),
    notes: shipment?.notes ?? "",
    items: (shipment?.items ?? []).map((it, i) => {
      const prod = typeof it.productId === "object" ? it.productId : null;
      return {
        key: `${prod?._id ?? "item"}-${i}`,
        productId: prod?._id ?? (typeof it.productId === "string" ? it.productId : ""),
        productTitle: prod?.productTitle ?? "",
        thumbnail: prod?.thumbnail,
        purchaseQuantity: String(it.purchaseQuantity),
        unitCost: String(it.unitCost),
        sellingPrice: it.sellingPrice != null ? String(it.sellingPrice) : "",
        notes: it.notes ?? "",
      };
    }),
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const totals = useMemo(() => {
    const subtotal = draft.items.reduce((a, it) => a + (Number(it.unitCost) || 0) * (Number(it.purchaseQuantity) || 0), 0);
    const shipping = Number(draft.shippingCost) || 0;
    const customs = Number(draft.customsCost) || 0;
    const tax = Number(draft.tax) || 0;
    const other = Number(draft.otherCost) || 0;
    const total = subtotal + shipping + customs + tax + other;
    const quantity = draft.items.reduce((a, it) => a + (Number(it.purchaseQuantity) || 0), 0);
    return { subtotal, total, quantity };
  }, [draft]);

  const addItem = (p: { _id: string; productTitle: string; thumbnail?: string; productCost?: number; customerSellPrice?: number }) => {
    if (draft.items.some((it) => it.productId === p._id)) return;
    setDraft((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          key: `${p._id}-${Date.now()}`,
          productId: p._id,
          productTitle: p.productTitle,
          thumbnail: p.thumbnail,
          purchaseQuantity: "",
          unitCost: p.productCost != null ? String(p.productCost) : "",
          sellingPrice: p.customerSellPrice != null ? String(p.customerSellPrice) : "",
          notes: "",
        },
      ],
    }));
  };
  const removeItem = (key: string) => setDraft((d) => ({ ...d, items: d.items.filter((i) => i.key !== key) }));
  const updateItem = (key: string, patch: Partial<DraftItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.supplierId) return setError("Pick a supplier.");
    if (!draft.items.length) return setError("Add at least one product.");
    for (const it of draft.items) {
      const qty = Number(it.purchaseQuantity);
      const cost = Number(it.unitCost);
      if (!it.productId) return setError("Each item must have a product.");
      if (!Number.isFinite(qty) || qty <= 0) return setError(`Quantity for ${it.productTitle || "an item"} must be > 0.`);
      if (!Number.isFinite(cost) || cost < 0) return setError(`Unit cost for ${it.productTitle || "an item"} must be ≥ 0.`);
    }
    setError("");
    setSaving(true);

    const payload = {
      supplierId: draft.supplierId,
      shipmentDate: draft.shipmentDate,
      expectedDate: draft.expectedDate || undefined,
      shippingCost: Number(draft.shippingCost) || 0,
      customsCost: Number(draft.customsCost) || 0,
      tax: Number(draft.tax) || 0,
      otherCost: Number(draft.otherCost) || 0,
      notes: draft.notes.trim() || undefined,
      items: draft.items.map((it) => ({
        productId: it.productId,
        purchaseQuantity: Number(it.purchaseQuantity),
        unitCost: Number(it.unitCost),
        sellingPrice: it.sellingPrice ? Number(it.sellingPrice) : undefined,
        notes: it.notes.trim() || undefined,
      })),
    };

    const res = shipment
      ? await action(`/admin/inventory/shipments/${shipment._id}`, { method: "PUT", json: payload })
      : await action("/admin/inventory/shipments", { method: "POST", json: payload });
    setSaving(false);
    if (res) onSaved();
  };

  return (
    <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">
          {shipment ? `Edit shipment ${shipment.shipmentNumber}` : "New shipment"}
        </h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Supplier *</span>
            <select className={inputClass} value={draft.supplierId} onChange={(e) => set("supplierId", e.target.value)}>
              <option value="">Select supplier</option>
              {suppliers.data?.suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Shipment date *</span>
            <input type="date" className={inputClass} value={draft.shipmentDate} onChange={(e) => set("shipmentDate", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Expected date</span>
            <input type="date" className={inputClass} value={draft.expectedDate} onChange={(e) => set("expectedDate", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Shipping cost</span>
            <input type="number" min={0} step="0.01" className={inputClass} value={draft.shippingCost} onChange={(e) => set("shippingCost", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Customs</span>
            <input type="number" min={0} step="0.01" className={inputClass} value={draft.customsCost} onChange={(e) => set("customsCost", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Tax</span>
            <input type="number" min={0} step="0.01" className={inputClass} value={draft.tax} onChange={(e) => set("tax", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Other</span>
            <input type="number" min={0} step="0.01" className={inputClass} value={draft.otherCost} onChange={(e) => set("otherCost", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Notes</span>
            <textarea className={inputClass} rows={2} value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Weekly PO notes, batch references, etc." />
          </label>
        </div>

        <section className="mt-5">
          <h3 className="mb-2 text-xs font-extrabold tracking-wider text-slate-500 uppercase">Items</h3>
          <div className="space-y-3">
            {draft.items.map((it) => (
              <div key={it.key} className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                <div className="flex items-center gap-3">
                  {it.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-800">{it.productTitle || "Unknown product"}</div>
                  </div>
                  <button type="button" onClick={() => removeItem(it.key)} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Qty *</span>
                    <input type="number" min={1} className={inputClass} value={it.purchaseQuantity} onChange={(e) => updateItem(it.key, { purchaseQuantity: e.target.value })} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Unit cost *</span>
                    <input type="number" min={0} step="0.01" className={inputClass} value={it.unitCost} onChange={(e) => updateItem(it.key, { unitCost: e.target.value })} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Sell price</span>
                    <input type="number" min={0} step="0.01" className={inputClass} value={it.sellingPrice} onChange={(e) => updateItem(it.key, { sellingPrice: e.target.value })} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Note</span>
                    <input className={inputClass} value={it.notes} onChange={(e) => updateItem(it.key, { notes: e.target.value })} />
                  </label>
                </div>
                <div className="mt-2 flex justify-end text-[11px] font-semibold text-slate-500">
                  Line total:&nbsp;<span className="font-bold text-slate-800">{formatBDT((Number(it.unitCost) || 0) * (Number(it.purchaseQuantity) || 0))}</span>
                </div>
              </div>
            ))}

            <ProductPicker exclude={draft.items.map((i) => i.productId)} onPick={addItem} />
          </div>
        </section>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4 text-xs font-semibold text-slate-600">
          <span>Qty: <b className="text-slate-900">{totals.quantity}</b></span>
          <span>Subtotal: <b className="text-slate-900">{formatBDT(totals.subtotal)}</b></span>
          <span>Total cost: <b className="text-slate-900">{formatBDT(totals.total)}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <FieldError message={error} />
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <PrimaryButton type="submit" loading={saving}>{shipment ? "Save changes" : "Create shipment"}</PrimaryButton>
        </div>
      </footer>
    </form>
  );
}

function ProductPicker({ exclude, onPick }: {
  exclude: string[];
  onPick: (p: { _id: string; productTitle: string; thumbnail: string; productCost?: number; customerSellPrice?: number }) => void;
}) {
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const results = useApiQuery<Product[]>(`/products${qs({ search: q, limit: 10 })}`);
  const list = results.data?.filter((p) => !exclude.includes(p._id)) ?? [];

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
      <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products to add..." />
      <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
        {results.loading && !results.data ? (
          <p className="p-2 text-xs text-slate-400">Loading products...</p>
        ) : !list.length ? (
          <p className="p-2 text-xs text-slate-400">{search ? "No product found." : "Type to search products."}</p>
        ) : (
          list.map((p) => (
            <button
              type="button"
              key={p._id}
              onClick={() =>
                onPick({
                  _id: p._id,
                  productTitle: p.productTitle,
                  thumbnail: p.thumbnail,
                  productCost: p.productCost,
                  customerSellPrice: p.customerSellPrice,
                })
              }
              className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-left hover:bg-blue-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbnail} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{p.productTitle}</span>
              <span className="text-[11px] text-slate-500">{formatBDT(p.customerSellPrice)}</span>
              <Plus className="h-4 w-4 text-blue-600" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
