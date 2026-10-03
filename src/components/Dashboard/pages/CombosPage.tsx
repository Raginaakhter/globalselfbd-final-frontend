"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  BarChart3,
  CirclePlus,
  DollarSign,
  Eye,
  Layers,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Combo, ComboPickerProduct, ComboStatsSummary, Status } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery, useImageUpload } from "../api";
import { formatBDT, formatShortDate } from "../format";
import {
  Drawer,
  EmptyState,
  ErrorBox,
  FieldError,
  Modal,
  PageHeader,
  Pager,
  PrimaryButton,
  SearchBox,
  Spinner,
  StatusPill,
  Toggle,
  inputClass,
  labelClass,
  selectClass,
  useConfirm,
  useDebounced,
} from "../ui";
import { ProductThumb } from "./ProductsCatalog";

/* ------------------------------------------------------------------ */
/*  Stats summary cards                                                */
/* ------------------------------------------------------------------ */

function StatsSummary() {
  const stats = useApiQuery<ComboStatsSummary>("/combos/stats/summary");
  if (!stats.data) return null;
  const t = stats.data.totals;
  const cards = [
    { label: "Total Combos", value: t.totalCombos, icon: Layers, color: "text-blue-600 bg-blue-50" },
    { label: "Total Sold", value: t.totalSold, icon: ShoppingCart, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Revenue", value: formatBDT(t.totalRevenue), icon: DollarSign, color: "text-violet-600 bg-violet-50" },
    { label: "Total Views", value: t.totalViews.toLocaleString(), icon: Eye, color: "text-amber-600 bg-amber-50" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
            <c.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">{c.label}</p>
            <p className="text-lg font-extrabold text-slate-900">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product picker for combo items                                     */
/* ------------------------------------------------------------------ */

function ProductPicker({
  selected,
  onChange,
}: {
  selected: { productId: string; quantity: number; title?: string; thumb?: string; price?: number }[];
  onChange: (items: typeof selected) => void;
}) {
  const { api } = useAuth();
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [results, setResults] = useState<ComboPickerProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    api<ComboPickerProduct[]>(`/combos/products/picker${qs({ search: q, limit: 20 })}`)
      .then((res) => { if (!cancelled) setResults(res.data ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, api]);

  const add = (p: ComboPickerProduct) => {
    if (selected.some((s) => s.productId === p._id)) return;
    onChange([...selected, { productId: p._id, quantity: 1, title: p.productTitle, thumb: p.thumbnail, price: p.finalPrice }]);
  };

  const remove = (id: string) => onChange(selected.filter((s) => s.productId !== id));
  const setQty = (id: string, qty: number) =>
    onChange(selected.map((s) => (s.productId === id ? { ...s, quantity: Math.max(1, Math.min(20, qty)) } : s)));

  return (
    <div className="space-y-3">
      <label className={labelClass}>Combo Items (min 2, max 20)</label>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add…"
          className={`${inputClass} pl-9`}
        />
      </div>
      {loading && <p className="text-xs text-slate-400">Searching…</p>}
      {results.length > 0 && (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
          {results
            .filter((r) => !selected.some((s) => s.productId === r._id))
            .map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => add(p)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-white"
              >
                <ProductThumb src={p.thumbnail} alt={p.productTitle} className="h-8 w-8" />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{p.productTitle}</span>
                <span className="shrink-0 font-bold text-slate-500">{formatBDT(p.finalPrice)}</span>
                <Plus className="h-4 w-4 text-blue-600" />
              </button>
            ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          {selected.map((s) => (
            <div key={s.productId} className="flex items-center gap-2 text-xs">
              <ProductThumb src={s.thumb} alt={s.title ?? ""} className="h-8 w-8" />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{s.title ?? s.productId}</span>
              <input
                type="number"
                min={1}
                max={20}
                value={s.quantity}
                onChange={(e) => setQty(s.productId, parseInt(e.target.value, 10) || 1)}
                className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-bold"
              />
              <span className="w-16 shrink-0 text-right font-bold text-slate-500">{formatBDT((s.price ?? 0) * s.quantity)}</span>
              <button type="button" onClick={() => remove(s.productId)} className="cursor-pointer text-rose-500 hover:text-rose-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create / Edit combo form (inside a Drawer)                         */
/* ------------------------------------------------------------------ */

type FormData = {
  comboTitle: string;
  description: string;
  comboPrice: string;
  thumbnail: string;
  gallery: string[];
  categoryId: string;
  items: { productId: string; quantity: number; title?: string; thumb?: string; price?: number }[];
  startsAt: string;
  endsAt: string;
  status: Status;
};

const EMPTY: FormData = {
  comboTitle: "",
  description: "",
  comboPrice: "",
  thumbnail: "",
  gallery: [],
  categoryId: "",
  items: [],
  startsAt: "",
  endsAt: "",
  status: "ACTIVE",
};

const toLocalInput = (value: string | Date) => {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function ComboForm({ combo, onClose, onSaved }: { combo: Combo | "new"; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const upload = useImageUpload();
  const isEdit = combo !== "new";
  const [form, setForm] = useState<FormData>(() => {
    if (!isEdit) return EMPTY;
    return {
      comboTitle: combo.comboTitle,
      description: combo.description,
      comboPrice: String(combo.comboPrice),
      thumbnail: combo.thumbnail ?? "",
      gallery: combo.gallery ?? [],
      categoryId: combo.categoryId ?? "",
      items: combo.itemDetails?.map((d) => ({ productId: d.productId, quantity: d.quantity, title: d.productTitle, thumb: d.thumbnail, price: d.unitPrice })) ?? combo.items,
      startsAt: combo.startsAt ? toLocalInput(combo.startsAt) : "",
      endsAt: combo.endsAt ? toLocalInput(combo.endsAt) : "",
      status: combo.status,
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.comboTitle.trim()) e.comboTitle = "Title is required";
    if (!form.comboPrice || Number(form.comboPrice) <= 0) e.comboPrice = "Price must be > 0";
    if (form.items.length < 2) e.items = "At least 2 products required";
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) e.endsAt = "End must be after start";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const urls = await upload(Array.from(e.target.files), "products");
      if (urls.length) set("thumbnail", urls[0]);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      comboTitle: form.comboTitle,
      description: form.description,
      comboPrice: Number(form.comboPrice),
      items: form.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      status: form.status,
    };
    if (form.thumbnail) body.thumbnail = form.thumbnail;
    if (form.categoryId) body.categoryId = form.categoryId;
    if (form.startsAt) body.startsAt = new Date(form.startsAt).toISOString();
    if (form.endsAt) body.endsAt = new Date(form.endsAt).toISOString();

    const path = isEdit ? `/combos/${combo._id}` : "/combos";
    const method = isEdit ? "PATCH" : "POST";
    const res = await action(path, { method, json: body });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-extrabold text-slate-900">{isEdit ? "Edit Combo" : "Create Combo"}</h2>
        <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div>
          <label className={labelClass}>Combo Title *</label>
          <input className={inputClass} value={form.comboTitle} onChange={(e) => set("comboTitle", e.target.value)} placeholder="Winter Essentials Bundle" />
          <FieldError message={errors.comboTitle} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Combo Price (BDT) *</label>
            <input type="number" className={inputClass} value={form.comboPrice} onChange={(e) => set("comboPrice", e.target.value)} min={0} step={0.01} />
            <FieldError message={errors.comboPrice} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={`${selectClass} w-full py-2.5`} value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Thumbnail</label>
          <div className="flex items-center gap-3">
            {form.thumbnail && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.thumbnail} alt="thumb" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              {uploading ? "Uploading…" : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Starts At</label>
            <input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Ends At</label>
            <input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            <FieldError message={errors.endsAt} />
          </div>
        </div>
        <ProductPicker selected={form.items} onChange={(items) => set("items", items)} />
        <FieldError message={errors.items} />
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
        <button onClick={onClose} className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <PrimaryButton loading={saving} onClick={save}>
          {isEdit ? "Save Changes" : "Create Combo"}
        </PrimaryButton>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function CombosPage() {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Combo | "new" | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const q = useDebounced(search);

  const canCreate = hasPermission("combos.create");
  const canUpdate = hasPermission("combos.update");
  const canDelete = hasPermission("combos.delete");

  const combos = useApiQuery<Combo[]>(`/combos${qs({ search: q, status, sort, page, limit: 20 })}`);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => (fn(v), setPage(1));

  const toggleStatus = async (c: Combo) => {
    const next = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await action<Combo>(`/combos/${c._id}/status`, { method: "PATCH", json: { status: next } });
    if (res) combos.reload();
  };

  const remove = async (c: Combo) => {
    const ok = await confirm({ title: "Delete combo?", text: `"${c.comboTitle}" will be deleted or deactivated if it has orders.`, confirmText: "Yes, Delete" });
    if (ok && (await action(`/combos/${c._id}`, { method: "DELETE" }))) combos.reload();
  };

  const toggleSelect = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = combos.data?.length ? combos.data.every((c) => selected.has(c._id)) : false;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(combos.data?.map((c) => c._id) ?? []));
  };

  const bulkActivate = async () => {
    if (!selected.size) return;
    await action("/combos/bulk-activate", { method: "POST", json: { ids: [...selected] } });
    setSelected(new Set());
    combos.reload();
  };
  const bulkDeactivate = async () => {
    if (!selected.size) return;
    await action("/combos/bulk-deactivate", { method: "POST", json: { ids: [...selected] } });
    setSelected(new Set());
    combos.reload();
  };
  const bulkDelete = async () => {
    if (!selected.size) return;
    const ok = await confirm({ title: `Delete ${selected.size} combo(s)?`, text: "Combos with orders will be deactivated instead.", confirmText: "Yes, Delete" });
    if (!ok) return;
    await action("/combos/bulk-delete", { method: "POST", json: { ids: [...selected] } });
    setSelected(new Set());
    combos.reload();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Combos" subtitle="Bundle products together and sell at a discount">
        {canCreate && (
          <PrimaryButton onClick={() => setEditing("new")}>
            <CirclePlus className="mr-2 h-4 w-4" /> New Combo
          </PrimaryButton>
        )}
      </PageHeader>

      <StatsSummary />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={reset(setSearch)} placeholder="Search combos…" />
        <select className={selectClass} value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="mostSold">Most Sold</option>
          <option value="displayOrder">Display Order</option>
        </select>
      </div>

      {selected.size > 0 && canUpdate && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">
          <span>{selected.size} selected</span>
          <button onClick={bulkActivate} className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700">Activate</button>
          <button onClick={bulkDeactivate} className="cursor-pointer rounded-lg bg-slate-600 px-3 py-1.5 text-white hover:bg-slate-700">Deactivate</button>
          {canDelete && (
            <button onClick={bulkDelete} className="cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700">Delete</button>
          )}
          <button onClick={() => setSelected(new Set())} className="cursor-pointer text-blue-600 hover:underline">Clear</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {combos.loading ? (
          <Spinner label="Loading combos…" />
        ) : combos.error ? (
          <ErrorBox message={combos.error} onRetry={combos.reload} />
        ) : !combos.data?.length ? (
          <EmptyState title="No combos found" text="Create your first combo to bundle products together." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  {canUpdate && (
                    <th className="px-3 py-3">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                    </th>
                  )}
                  <th className="px-4 py-3 font-bold text-slate-600">Combo</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Price</th>
                  <th className="hidden px-4 py-3 font-bold text-slate-600 md:table-cell">Savings</th>
                  <th className="hidden px-4 py-3 font-bold text-slate-600 sm:table-cell">Items</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Status</th>
                  <th className="hidden px-4 py-3 font-bold text-slate-600 lg:table-cell">Sold</th>
                  <th className="hidden px-4 py-3 font-bold text-slate-600 lg:table-cell">Revenue</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {combos.data.map((c) => (
                  <tr key={c._id} className="transition-colors hover:bg-slate-50/80">
                    {canUpdate && (
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleSelect(c._id)} className="rounded" />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={c.thumbnail} alt={c.comboTitle} className="h-11 w-11" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{c.comboTitle}</p>
                          <p className="truncate text-[10px] text-slate-400">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{formatBDT(c.comboPrice)}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="font-bold text-emerald-600">{c.discountPercent}% off</span>
                      <span className="ml-1 text-[10px] text-slate-400">({formatBDT(c.savings)})</span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{c.items?.length ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusPill value={c.status} />
                        {c.isLive && <StatusPill value="LIVE" />}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 font-bold text-slate-700 lg:table-cell">{c.soldCount}</td>
                    <td className="hidden px-4 py-3 font-bold text-slate-700 lg:table-cell">{formatBDT(c.revenue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canUpdate && (
                          <>
                            <Toggle checked={c.status === "ACTIVE"} onChange={() => toggleStatus(c)} />
                            <button onClick={() => setEditing(c)} className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button onClick={() => remove(c)} className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={combos.pagination} onPage={setPage} />
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && <ComboForm combo={editing} onClose={() => setEditing(null)} onSaved={combos.reload} />}
      </Drawer>
    </div>
  );
}
