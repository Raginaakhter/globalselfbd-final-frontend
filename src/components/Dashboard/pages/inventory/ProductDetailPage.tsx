"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, History, Minus, Package, PackageOpen, PackagePlus, Pencil, Plus, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { InventoryLot, InventoryProductDetail, StockMovement, StockMovementType } from "@/lib/backend-types";
import { useApiAction, useApiQuery } from "../../api";
import { formatBDT, formatShortDate } from "../../format";
import {
  ErrorBox,
  FieldError,
  Modal,
  PageHeader,
  PrimaryButton,
  Spinner,
  Toggle,
  inputClass,
  labelClass,
} from "../../ui";
import { INVENTORY_BASE, MovementTypeBadge, StockStatusBadge, signedQty } from "./shared";

type Action = null | "stock" | "adjust" | "damage" | "return" | "threshold";

export default function ProductDetailPage({ productId }: { productId: string }) {
  const { hasPermission } = useAuth();
  const detail = useApiQuery<InventoryProductDetail>(`/admin/inventory/${productId}`);
  const [action, setAction] = useState<Action>(null);

  if (detail.loading && !detail.data) return <Spinner label="Loading product inventory..." />;
  if (detail.error) return <ErrorBox message={detail.error} onRetry={detail.reload} />;
  if (!detail.data) return null;

  const { product, lots, recentMovements } = detail.data;
  const canUpdate = hasPermission("inventory.update");
  const canAdjust = hasPermission("inventory.adjust");

  return (
    <div className="flex w-full flex-col gap-6">
      <Link href={`${INVENTORY_BASE}/products`} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to inventory
      </Link>

      <PageHeader title={product.productTitle} subtitle={`SKU: ${product.sku || "—"} · ${product.stockStatus.replace(/_/g, " ")}`}>
        {canUpdate && (
          <>
            <button
              type="button"
              onClick={() => setAction("stock")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Package className="h-4 w-4" /> Set stock
            </button>
            <button
              type="button"
              onClick={() => setAction("threshold")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Pencil className="h-4 w-4" /> Edit settings
            </button>
          </>
        )}
        {canAdjust && (
          <>
            <button
              type="button"
              onClick={() => setAction("adjust")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Adjust
            </button>
            <button
              type="button"
              onClick={() => setAction("damage")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              <PackageOpen className="h-4 w-4" /> Damage / loss
            </button>
            <button
              type="button"
              onClick={() => setAction("return")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Record return
            </button>
          </>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Stock" value={product.stock.toLocaleString()} />
        <Stat label="Reserved" value={product.reserved.toLocaleString()} />
        <Stat label="Available" value={product.available.toLocaleString()} highlight />
        <Stat label="Low threshold" value={product.lowStockThreshold.toLocaleString()} />
        <Stat label="Damaged" value={product.damagedQuantity.toLocaleString()} />
        <Stat label="Returned" value={product.returnedQuantity.toLocaleString()} />
        <Stat label="Sold" value={product.soldQuantity.toLocaleString()} />
        <Stat label="Revenue" value={formatBDT(product.soldRevenue)} />
        <Stat label="COGS" value={formatBDT(product.cogs)} />
        <Stat label="Profit" value={formatBDT(product.profit)} highlight />
        <Stat label="Margin" value={`${product.margin.toFixed(2)}%`} />
        <Stat
          label="Status"
          value=""
          custom={<StockStatusBadge value={product.stockStatus} />}
        />
      </div>

      <LotsSection lots={lots} />
      <MovementsSection movements={recentMovements} />

      <Modal open={!!action} onClose={() => setAction(null)} className="max-w-md rounded-2xl">
        {action === "stock" && <SetStockForm productId={productId} currentStock={product.stock} onClose={() => setAction(null)} onSaved={detail.reload} />}
        {action === "threshold" && (
          <ThresholdForm productId={productId} initial={{ lowStockThreshold: product.lowStockThreshold, sku: product.sku ?? "" }} onClose={() => setAction(null)} onSaved={detail.reload} />
        )}
        {action === "adjust" && <AdjustForm productId={productId} onClose={() => setAction(null)} onSaved={detail.reload} />}
        {action === "damage" && <DamageForm productId={productId} onClose={() => setAction(null)} onSaved={detail.reload} />}
        {action === "return" && <ReturnForm productId={productId} onClose={() => setAction(null)} onSaved={detail.reload} />}
      </Modal>
    </div>
  );
}

function Stat({ label, value, highlight, custom }: { label: string; value: string; highlight?: boolean; custom?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{label}</div>
      <div className={`mt-1 ${highlight ? "text-2xl font-extrabold text-slate-900" : "text-lg font-bold text-slate-800"}`}>
        {custom ?? value}
      </div>
    </div>
  );
}

function LotsSection({ lots }: { lots: InventoryLot[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-extrabold text-slate-800">Active FIFO lots</h3>
        <span className="text-[11px] font-semibold text-slate-400">{lots.length} lots</span>
      </header>
      {!lots.length ? (
        <div className="p-8 text-center text-xs text-slate-400">No active lots. Receive a shipment to create one.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-5 py-3">Lot number</th>
                <th className="px-3 py-3">Supplier</th>
                <th className="px-3 py-3 text-right">Received</th>
                <th className="px-3 py-3 text-right">Remaining</th>
                <th className="px-3 py-3 text-right">Unit cost</th>
                <th className="px-3 py-3 text-right">Landed cost</th>
                <th className="px-3 py-3 text-right">Sell price</th>
                <th className="px-5 py-3">Received date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lots.map((lot) => {
                const supplier = typeof lot.supplierId === "object" ? lot.supplierId?.name : "—";
                return (
                  <tr key={lot._id}>
                    <td className="px-5 py-3 font-mono text-slate-700">{lot.lotNumber}</td>
                    <td className="px-3 py-3 text-slate-600">{supplier ?? "—"}</td>
                    <td className="px-3 py-3 text-right">{lot.receivedQuantity.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-800">{lot.remainingQuantity.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{formatBDT(lot.unitCost)}</td>
                    <td className="px-3 py-3 text-right">{formatBDT(lot.landedUnitCost)}</td>
                    <td className="px-3 py-3 text-right">{formatBDT(lot.sellingPrice)}</td>
                    <td className="px-5 py-3 text-slate-500">{formatShortDate(lot.receivedDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MovementsSection({ movements }: { movements: StockMovement[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          Recent stock movements
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">{movements.length} items</span>
      </header>
      {!movements.length ? (
        <div className="p-8 text-center text-xs text-slate-400">No stock movements yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-5 py-3">Date</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3 text-right">Previous</th>
                <th className="px-3 py-3 text-right">New</th>
                <th className="px-3 py-3 text-right">Unit cost</th>
                <th className="px-5 py-3">Reason / reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m, i) => (
                <tr key={m._id ?? i}>
                  <td className="px-5 py-3 text-slate-500">{formatShortDate(m.createdAt)}</td>
                  <td className="px-3 py-3">
                    <MovementTypeBadge value={m.type} />
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-slate-800">{signedQty(m.type, m.quantity)}</td>
                  <td className="px-3 py-3 text-right text-slate-500">{m.previousStock}</td>
                  <td className="px-3 py-3 text-right text-slate-800">{m.newStock}</td>
                  <td className="px-3 py-3 text-right text-slate-500">{m.unitCost != null ? formatBDT(m.unitCost) : "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{m.reason || (m.orderId ? `Order #${typeof m.orderId === "string" ? m.orderId.slice(-6) : ""}` : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------- forms ---------- */

function FormShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <Minus className="h-4 w-4" />
        </button>
      </header>
      <div className="p-5">{children}</div>
    </>
  );
}

function SetStockForm({ productId, currentStock, onClose, onSaved }: { productId: string; currentStock: number; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [stock, setStock] = useState<string>(String(currentStock));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(stock);
    if (!Number.isFinite(value) || value < 0) return setError("Stock must be a non-negative number.");
    if (!reason.trim()) return setError("Reason is required for the audit log.");
    setError("");
    setSaving(true);
    const res = await action(`/admin/inventory/${productId}/stock`, { method: "PATCH", json: { stock: value, reason: reason.trim() } });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <FormShell title="Set exact stock" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>New stock (current: {currentStock})</span>
          <input type="number" min={0} className={inputClass} value={stock} onChange={(e) => setStock(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Reason (audit log)</span>
          <input className={inputClass} placeholder="e.g. Physical stock correction after count" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <FieldError message={error} />
        <PrimaryButton type="submit" loading={saving}>Save stock</PrimaryButton>
      </form>
    </FormShell>
  );
}

function ThresholdForm({ productId, initial, onClose, onSaved }: { productId: string; initial: { lowStockThreshold: number; sku: string }; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [threshold, setThreshold] = useState<string>(String(initial.lowStockThreshold));
  const [sku, setSku] = useState<string>(initial.sku);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(threshold);
    if (!Number.isFinite(n) || n < 0) return setError("Threshold must be a non-negative integer.");
    setError("");
    setSaving(true);
    const res = await action(`/admin/inventory/${productId}`, { method: "PUT", json: { lowStockThreshold: n, sku: sku.trim() } });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <FormShell title="Inventory settings" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>SKU</span>
          <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Low-stock threshold</span>
          <input type="number" min={0} className={inputClass} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          <span className="text-[11px] text-slate-400">Alerts fire when available stock drops to or below this number.</span>
        </label>
        <FieldError message={error} />
        <PrimaryButton type="submit" loading={saving}>Save settings</PrimaryButton>
      </form>
    </FormShell>
  );
}

function AdjustForm({ productId, onClose, onSaved }: { productId: string; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [adjustBy, setAdjustBy] = useState<string>("");
  const [reason, setReason] = useState("");
  const [typeOverride, setTypeOverride] = useState<"" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT">("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const delta = Number(adjustBy);
    if (!Number.isFinite(delta) || delta === 0) return setError("Enter a non-zero integer. Use negatives to subtract.");
    if (!reason.trim()) return setError("Reason is required for the audit log.");
    setError("");
    setSaving(true);
    const payload: { productId: string; adjustBy: number; reason: string; type?: StockMovementType } = {
      productId,
      adjustBy: Math.trunc(delta),
      reason: reason.trim(),
    };
    if (typeOverride) payload.type = typeOverride;
    const res = await action("/admin/inventory/adjust", { method: "POST", json: payload });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <FormShell title="Adjust stock" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Delta (positive adds, negative removes)</span>
          <input type="number" className={inputClass} value={adjustBy} onChange={(e) => setAdjustBy(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Reason</span>
          <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Received back-order" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Movement type (optional)</span>
          <select className={inputClass} value={typeOverride} onChange={(e) => setTypeOverride(e.target.value as "" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT")}>
            <option value="">Automatic (based on sign)</option>
            <option value="ADJUSTMENT_IN">Adjustment in</option>
            <option value="ADJUSTMENT_OUT">Adjustment out</option>
          </select>
        </label>
        <FieldError message={error} />
        <PrimaryButton type="submit" loading={saving}>
          <PackagePlus className="mr-2 h-4 w-4" /> Record adjustment
        </PrimaryButton>
      </form>
    </FormShell>
  );
}

function DamageForm({ productId, onClose, onSaved }: { productId: string; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(quantity);
    if (!Number.isFinite(n) || n <= 0) return setError("Enter a positive integer.");
    if (!reason.trim()) return setError("Reason is required.");
    setError("");
    setSaving(true);
    const res = await action("/admin/inventory/damage", { method: "POST", json: { productId, quantity: Math.trunc(n), reason: reason.trim() } });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <FormShell title="Record damage / loss" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Quantity</span>
          <input type="number" min={1} className={inputClass} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Reason</span>
          <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Broken bottles in warehouse" />
        </label>
        <FieldError message={error} />
        <PrimaryButton type="submit" loading={saving}>Record damage</PrimaryButton>
      </form>
    </FormShell>
  );
}

function ReturnForm({ productId, onClose, onSaved }: { productId: string; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState("");
  const [orderId, setOrderId] = useState("");
  const [sellable, setSellable] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(quantity);
    if (!Number.isFinite(n) || n <= 0) return setError("Enter a positive integer.");
    if (!reason.trim()) return setError("Reason is required.");
    setError("");
    setSaving(true);
    const res = await action("/admin/inventory/return", {
      method: "POST",
      json: {
        productId,
        quantity: Math.trunc(n),
        sellable,
        reason: reason.trim(),
        ...(orderId.trim() ? { orderId: orderId.trim() } : {}),
      },
    });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <FormShell title="Record customer return" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Quantity</span>
          <input type="number" min={1} className={inputClass} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Reason</span>
          <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Wrong size, resellable" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Order ID (optional)</span>
          <input className={inputClass} value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Links the return to its order" />
        </label>
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
          <span className={labelClass}>Resellable (restock)</span>
          <Toggle checked={sellable} onChange={setSellable} />
        </label>
        <FieldError message={error} />
        <PrimaryButton type="submit" loading={saving}>Record return</PrimaryButton>
      </form>
    </FormShell>
  );
}
