"use client";

import { useState, useEffect } from "react";
import {
  CalendarClock,
  CirclePlus,
  Megaphone,
  Pencil,
  Percent,
  Plus,
  Search,
  Tag,
  Trash,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Category, Offer, OfferState, Status } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery, useImageUpload } from "../api";
import { formatBDT, formatShortDate } from "../format";
import {
  Drawer,
  EmptyState,
  ErrorBox,
  FieldError,
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
/*  Offer form (Drawer)                                                */
/* ------------------------------------------------------------------ */

type OfferForm = {
  title: string;
  description: string;
  bannerImage: string;
  badgeColor: string;
  badgeLabel: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  startsAt: string;
  endsAt: string;
  productIds: string[];
  categoryIds: string[];
  minOrderValue: string;
  status: Status;
};

const EMPTY_FORM: OfferForm = {
  title: "",
  description: "",
  bannerImage: "",
  badgeColor: "#ff0040",
  badgeLabel: "SALE",
  discountType: "PERCENTAGE",
  discountValue: "",
  startsAt: "",
  endsAt: "",
  productIds: [],
  categoryIds: [],
  minOrderValue: "",
  status: "ACTIVE",
};

const toLocalInput = (value: string | Date) => {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* ---- Inline product search for the offer form ---- */
function ProductSearch({ selectedIds, onAdd, onRemove }: { selectedIds: string[]; onAdd: (id: string, title: string) => void; onRemove: (id: string) => void }) {
  const { api } = useAuth();
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [results, setResults] = useState<{ _id: string; productTitle: string; thumbnail: string }[]>([]);
  const [loading, setLoading] = useState(false);
  // Keep names so we can display them
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!q) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    api<{ _id: string; productTitle: string; thumbnail: string }[]>(`/combos/products/picker${qs({ search: q, limit: 20 })}`)
      .then((res) => { if (!cancelled) setResults(res.data ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, api]);

  return (
    <div className="space-y-2">
      <label className={labelClass}>Products</label>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className={`${inputClass} pl-9`} />
      </div>
      {loading && <p className="text-xs text-slate-400">Searching…</p>}
      {results.length > 0 && (
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
          {results.filter((r) => !selectedIds.includes(r._id)).map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => { onAdd(p._id, p.productTitle); setNames((n) => ({ ...n, [p._id]: p.productTitle })); }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-white"
            >
              <ProductThumb src={p.thumbnail} alt={p.productTitle} className="h-7 w-7" />
              <span className="flex-1 truncate font-medium text-slate-700">{p.productTitle}</span>
              <Plus className="h-4 w-4 text-blue-600" />
            </button>
          ))}
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
              {names[id] ?? id.slice(-6)}
              <button type="button" onClick={() => onRemove(id)} className="cursor-pointer text-blue-400 hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function OfferFormDrawer({ offer, onClose, onSaved }: { offer: Offer | "new"; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const upload = useImageUpload();
  const isEdit = offer !== "new";
  const categories = useApiQuery<Category[]>("/categories");
  const [form, setForm] = useState<OfferForm>(() => {
    if (!isEdit) return EMPTY_FORM;
    return {
      title: offer.title,
      description: offer.description,
      bannerImage: offer.bannerImage ?? "",
      badgeColor: offer.badgeColor ?? "#ff0040",
      badgeLabel: offer.badgeLabel ?? "SALE",
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      startsAt: offer.startsAt ? toLocalInput(offer.startsAt) : "",
      endsAt: offer.endsAt ? toLocalInput(offer.endsAt) : "",
      productIds: offer.productIds ?? [],
      categoryIds: offer.categoryIds ?? [],
      minOrderValue: offer.minOrderValue ? String(offer.minOrderValue) : "",
      status: offer.status,
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof OfferForm>(k: K, v: OfferForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title required";
    if (!form.discountValue || Number(form.discountValue) <= 0) e.discountValue = "Discount must be > 0";
    if (form.discountType === "PERCENTAGE" && Number(form.discountValue) > 100) e.discountValue = "Max 100%";
    if (!form.startsAt) e.startsAt = "Start date required";
    if (!form.endsAt) e.endsAt = "End date required";
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) e.endsAt = "End must be after start";
    if (form.productIds.length === 0 && form.categoryIds.length === 0) e.scope = "Add at least one product or category";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const urls = await upload(Array.from(e.target.files), "banners");
      if (urls.length) set("bannerImage", urls[0]);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      badgeColor: form.badgeColor,
      badgeLabel: form.badgeLabel,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      productIds: form.productIds,
      categoryIds: form.categoryIds,
      status: form.status,
    };
    if (form.bannerImage) body.bannerImage = form.bannerImage;
    if (form.minOrderValue) body.minOrderValue = Number(form.minOrderValue);

    const path = isEdit ? `/offers/${offer._id}` : "/offers";
    const method = isEdit ? "PATCH" : "POST";
    const res = await action(path, { method, json: body });
    setSaving(false);
    if (res) { onSaved(); onClose(); }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-extrabold text-slate-900">{isEdit ? "Edit Offer" : "Create Offer"}</h2>
        <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div>
          <label className={labelClass}>Offer Title *</label>
          <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Mega Discount Week" />
          <FieldError message={errors.title} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} min-h-[60px] resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Discount Type</label>
            <select className={`${selectClass} w-full py-2.5`} value={form.discountType} onChange={(e) => set("discountType", e.target.value as "PERCENTAGE" | "FIXED")}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Discount Value *</label>
            <input type="number" className={inputClass} value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} min={0} />
            <FieldError message={errors.discountValue} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Badge Label</label>
            <input className={inputClass} value={form.badgeLabel} onChange={(e) => set("badgeLabel", e.target.value)} placeholder="SALE" />
          </div>
          <div>
            <label className={labelClass}>Badge Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.badgeColor} onChange={(e) => set("badgeColor", e.target.value)} className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200" />
              <input className={`${inputClass} w-24`} value={form.badgeColor} onChange={(e) => set("badgeColor", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={`${selectClass} w-full py-2.5`} value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Starts At *</label>
            <input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            <FieldError message={errors.startsAt} />
          </div>
          <div>
            <label className={labelClass}>Ends At *</label>
            <input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            <FieldError message={errors.endsAt} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Min Order Value</label>
          <input type="number" className={inputClass} value={form.minOrderValue} onChange={(e) => set("minOrderValue", e.target.value)} min={0} placeholder="Optional" />
        </div>
        <div>
          <label className={labelClass}>Banner Image</label>
          <div className="flex items-center gap-3">
            {form.bannerImage && (
              <div className="relative h-12 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.bannerImage} alt="banner" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              {uploading ? "Uploading…" : "Upload Banner"}
              <input type="file" accept="image/*" className="hidden" onChange={handleBanner} />
            </label>
          </div>
        </div>
        <ProductSearch
          selectedIds={form.productIds}
          onAdd={(id) => set("productIds", [...form.productIds, id])}
          onRemove={(id) => set("productIds", form.productIds.filter((p) => p !== id))}
        />
        <div>
          <label className={labelClass}>Categories</label>
          {categories.data && (
            <div className="flex flex-wrap gap-1.5">
              {categories.data.map((c) => {
                const sel = form.categoryIds.includes(c._id);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => set("categoryIds", sel ? form.categoryIds.filter((id) => id !== c._id) : [...form.categoryIds, c._id])}
                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${sel ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <FieldError message={errors.scope} />
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
        <button onClick={onClose} className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
        <PrimaryButton loading={saving} onClick={save}>{isEdit ? "Save Changes" : "Create Offer"}</PrimaryButton>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

const STATE_OPTIONS: { value: OfferState | ""; label: string }[] = [
  { value: "", label: "All states" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ENDED", label: "Ended" },
];

export default function OffersPage() {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Offer | "new" | null>(null);
  const q = useDebounced(search);

  const canCreate = hasPermission("offers.create");
  const canUpdate = hasPermission("offers.update");
  const canDelete = hasPermission("offers.delete");

  const offers = useApiQuery<Offer[]>(`/offers${qs({ search: q, status, sort, page, limit: 20 })}`);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => (fn(v), setPage(1));

  const toggleStatus = async (o: Offer) => {
    const next = o.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await action<Offer>(`/offers/${o._id}/status`, { method: "PATCH", json: { status: next } });
    if (res) offers.reload();
  };

  const remove = async (o: Offer) => {
    const ok = await confirm({ title: "Delete offer?", text: `"${o.title}" will be permanently deleted.`, confirmText: "Yes, Delete" });
    if (ok && (await action(`/offers/${o._id}`, { method: "DELETE" }))) offers.reload();
  };

  const editOffer = async (o: Offer) => {
    setEditing(o);
  };

  const discountLabel = (o: Offer) => o.discountType === "PERCENTAGE" ? `${o.discountValue}%` : formatBDT(o.discountValue);

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Offer Campaigns" subtitle="Promote products and categories with time-limited offers">
        {canCreate && (
          <PrimaryButton onClick={() => setEditing("new")}>
            <CirclePlus className="mr-2 h-4 w-4" /> New Offer
          </PrimaryButton>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={reset(setSearch)} placeholder="Search offers…" />
        <select className={selectClass} value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
          {STATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="displayOrder">Display Order</option>
          <option value="endingSoon">Ending Soon</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {offers.loading ? (
          <Spinner label="Loading offers…" />
        ) : offers.error ? (
          <ErrorBox message={offers.error} onRetry={offers.reload} />
        ) : !offers.data?.length ? (
          <EmptyState title="No offers found" text="Create your first offer campaign to attract customers." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-600">Offer</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Discount</th>
                  <th className="hidden px-4 py-3 font-bold text-slate-600 md:table-cell">Period</th>
                  <th className="px-4 py-3 font-bold text-slate-600">State</th>
                  <th className="hidden px-4 py-3 font-bold text-slate-600 sm:table-cell">Scope</th>
                  <th className="px-4 py-3 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.data.map((o) => (
                  <tr key={o._id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {o.bannerImage ? (
                          <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={o.bannerImage} alt={o.title} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-orange-50 text-rose-400">
                            <Megaphone className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{o.title}</p>
                          {o.badgeLabel && (
                            <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-black text-white" style={{ backgroundColor: o.badgeColor ?? "#333" }}>
                              {o.badgeLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-rose-600">{discountLabel(o)}</span>
                      <span className="ml-1 text-[10px] text-slate-400">{o.discountType === "PERCENTAGE" ? "off" : "flat"}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                      <div className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatShortDate(o.startsAt)} – {formatShortDate(o.endsAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill value={o.state} />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="text-slate-500">
                        {o.productIds?.length ?? 0}P · {o.categoryIds?.length ?? 0}C
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canUpdate && (
                          <>
                            <Toggle checked={o.status === "ACTIVE"} onChange={() => toggleStatus(o)} />
                            <button onClick={() => editOffer(o)} className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button onClick={() => remove(o)} className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
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
        <Pager pagination={offers.pagination} onPage={setPage} />
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && <OfferFormDrawer offer={editing} onClose={() => setEditing(null)} onSaved={offers.reload} />}
      </Drawer>
    </div>
  );
}
