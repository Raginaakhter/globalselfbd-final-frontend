"use client";

import { useState } from "react";
import { CalendarClock, CalendarDays, Layers, Pencil, Percent, Plus, RefreshCw, Sparkles, Tag, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Category, Coupon, CouponScope, CouponState, DiscountType, Product } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery } from "../api";
import { formatBDT, formatShortDate } from "../format";
import {
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

const SCOPE_LABELS: Record<CouponScope, string> = { ENTIRE_ORDER: "Entire order", CATEGORIES: "Categories", PRODUCTS: "Products" };
const SCOPE_BUTTON_LABELS: Record<CouponScope, string> = { ENTIRE_ORDER: "Entire Order", CATEGORIES: "Categories", PRODUCTS: "Products" };
const STATE_OPTIONS: { value: CouponState | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "USED_UP", label: "Used up" },
  { value: "INACTIVE", label: "Inactive" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "expiring", label: "Expiring soonest" },
  { value: "mostUsed", label: "Most used" },
  { value: "code", label: "Code A–Z" },
];

const valueLabel = (c: Pick<Coupon, "discountType" | "discountValue">) =>
  c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `${formatBDT(c.discountValue)} OFF`;

// <input type="datetime-local"> works in local time without a zone
const toLocalInput = (value: string | Date) => {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function CouponsPage() {
  const { api, hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const q = useDebounced(search);
  const coupons = useApiQuery<Coupon[]>(`/coupons${qs({ search: q, status, discountType, sort, page })}`);
  const canUpdate = hasPermission("coupons.update");

  const filter = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const edit = async (c: Coupon) => {
    // The list has no category/product names; load the full coupon for the form
    const res = await api<Coupon>(`/coupons/${c._id}`).catch(() => null);
    setEditing(res?.data ?? c);
  };

  const toggle = async (c: Coupon, on: boolean) => {
    const res = await action<Coupon>(`/coupons/${c._id}/status`, { method: "PATCH", json: { status: on ? "ACTIVE" : "INACTIVE" } });
    if (res) coupons.setData((l) => l?.map((x) => (x._id === c._id ? res.data : x)) ?? l);
  };

  const remove = async (c: Coupon) => {
    const ok = await confirm({
      title: `Delete coupon ${c.code}?`,
      text: c.usedCount > 0 ? "Orders that already used it keep their discount." : "Customers will no longer be able to use it.",
      confirmText: "Yes, Delete",
    });
    if (ok && (await action(`/coupons/${c._id}`, { method: "DELETE" }))) coupons.reload();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Coupons" subtitle="Create, configure and monitor discount coupons. Customers enter the code at checkout.">
        {coupons.pagination && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{coupons.pagination.total} total</span>}
        <button onClick={coupons.reload} title="Refresh" className="cursor-pointer rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" />
        </button>
        {hasPermission("coupons.create") && (
          <PrimaryButton onClick={() => setEditing("new")}>
            <Plus className="mr-2 h-4 w-4" /> Create Coupon
          </PrimaryButton>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by coupon code or description..."
        />
        <select className={selectClass} value={status} onChange={filter(setStatus)}>
          {STATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select className={selectClass} value={discountType} onChange={filter(setDiscountType)}>
          <option value="">All discount types</option>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
        </select>
        <select className={selectClass} value={sort} onChange={filter(setSort)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {coupons.loading && !coupons.data ? (
          <Spinner label="Loading coupons..." />
        ) : coupons.error ? (
          <ErrorBox message={coupons.error} onRetry={coupons.reload} />
        ) : !coupons.data?.length ? (
          <EmptyState title="No coupons found" text={search || status || discountType ? "No coupon matches your filters." : "Create your first coupon. Customers can enter it at checkout."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Type & value</th>
                  <th className="px-4 py-3.5">Min order</th>
                  <th className="px-4 py-3.5">Max discount</th>
                  <th className="px-4 py-3.5">Usage & limit</th>
                  <th className="px-4 py-3.5">Validity</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.data.map((c) => (
                  <tr key={c._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-sm font-extrabold tracking-wider text-blue-700">{c.code}</span>
                    </td>
                    <td className="max-w-[220px] px-4 py-4">
                      <div className="truncate text-slate-700">{c.description || <span className="text-slate-400">No description</span>}</div>
                      <div className="text-[11px] text-slate-400">Scope: {SCOPE_LABELS[c.scope]}</div>
                    </td>
                    <td className="px-4 py-4 text-sm font-extrabold whitespace-nowrap text-slate-900">{valueLabel(c)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{c.minOrderAmount ? formatBDT(c.minOrderAmount) : "None"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{c.maxDiscount ? formatBDT(c.maxDiscount) : "Unlimited"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {c.usageLimit ? (
                        <div className="w-28">
                          <div className="font-bold text-slate-800">
                            {c.usedCount} / {c.usageLimit}
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min((c.usedCount / c.usageLimit) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800">{c.usedCount} used</span>
                      )}
                      {c.perUserLimit && <div className="text-[11px] text-slate-400">{c.perUserLimit} per customer</div>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-emerald-600" /> {formatShortDate(c.startsAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-rose-500" /> {formatShortDate(c.expiresAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {canUpdate && <Toggle checked={c.status === "ACTIVE"} onChange={(v) => toggle(c, v)} />}
                        <StatusPill value={c.state} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <button onClick={() => edit(c)} title="Edit" className="cursor-pointer p-1.5 text-slate-400 hover:text-blue-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission("coupons.delete") && (
                          <button onClick={() => remove(c)} title="Delete" className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600">
                            <Trash className="h-4 w-4" />
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
        <Pager pagination={coupons.pagination} onPage={setPage} />
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} className="max-w-3xl">
        {editing && (
          <CouponForm key={editing === "new" ? "new" : editing._id} coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={coupons.reload} />
        )}
      </Modal>
    </div>
  );
}

function CouponForm({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const now = new Date();
  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    active: coupon ? coupon.status === "ACTIVE" : true,
    discountType: coupon?.discountType ?? ("PERCENTAGE" as DiscountType),
    discountValue: coupon ? String(coupon.discountValue) : "10",
    minOrderAmount: coupon?.minOrderAmount ? String(coupon.minOrderAmount) : "",
    maxDiscount: coupon?.maxDiscount ? String(coupon.maxDiscount) : "",
    usageLimit: coupon?.usageLimit ? String(coupon.usageLimit) : "",
    perUserLimit: coupon ? (coupon.perUserLimit ? String(coupon.perUserLimit) : "") : "1",
    scope: coupon?.scope ?? ("ENTIRE_ORDER" as CouponScope),
    startsAt: toLocalInput(coupon?.startsAt ?? now),
    expiresAt: toLocalInput(coupon?.expiresAt ?? new Date(now.getTime() + 30 * 24 * 3600 * 1000)),
  });
  const [categoryIds, setCategoryIds] = useState<string[]>(coupon?.categoryIds ?? []);
  const [products, setProducts] = useState<{ _id: string; productTitle: string; thumbnail: string }[]>(coupon?.products ?? []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const categories = useApiQuery<Category[]>(form.scope === "CATEGORIES" ? "/categories?status=ACTIVE" : null);
  const usedCode = !!coupon && coupon.usedCount > 0;

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const value = Number(form.discountValue);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return setError("Coupon code must be 3-30 letters, numbers, - or _ (e.g. SUMMER20).");
    if (!(value > 0)) return setError("Enter a discount value.");
    if (form.discountType === "PERCENTAGE" && value > 100) return setError("Percentage cannot be more than 100.");
    if (new Date(form.expiresAt) <= new Date(form.startsAt)) return setError("Expiry must be after the start date.");
    if (form.scope === "CATEGORIES" && !categoryIds.length) return setError("Select at least one category.");
    if (form.scope === "PRODUCTS" && !products.length) return setError("Select at least one product.");
    setError("");
    setSaving(true);
    const body = {
      code,
      description: form.description.trim(),
      status: form.active ? "ACTIVE" : "INACTIVE",
      discountType: form.discountType,
      discountValue: value,
      minOrderAmount: num(form.minOrderAmount),
      maxDiscount: num(form.maxDiscount),
      usageLimit: num(form.usageLimit),
      perUserLimit: num(form.perUserLimit),
      scope: form.scope,
      categoryIds: form.scope === "CATEGORIES" ? categoryIds : [],
      productIds: form.scope === "PRODUCTS" ? products.map((p) => p._id) : [],
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
    };
    const res = coupon ? await action(`/coupons/${coupon._id}`, { method: "PUT", json: body }) : await action("/coupons", { method: "POST", json: body });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  const typeButton = (active: boolean) =>
    `flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition ${
      active ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    }`;
  const scopeButton = (active: boolean) =>
    `flex h-12 flex-1 cursor-pointer items-center justify-center rounded-2xl border text-sm font-bold transition ${
      active ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <form onSubmit={submit} className="flex max-h-[90vh] flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100/70 text-blue-600">
            <Tag className="h-6 w-6" />
          </span>
          <div>
            <h2 className="flex items-center gap-1.5 text-xl font-extrabold text-slate-900">
              {coupon ? `Edit Coupon ${coupon.code}` : "Create New Coupon"}
              <Sparkles className="h-5 w-5 fill-amber-400 text-amber-400" />
            </h2>
            <p className="text-sm text-slate-500">{coupon ? "Update this discount promotion for your store" : "Set up a new discount promotion for your store"}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
        <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
          <label className="flex flex-col gap-2">
            <FormLabel required>Coupon Code</FormLabel>
            <input
              className={`${bigInput} font-mono font-extrabold tracking-wider uppercase`}
              value={form.code}
              maxLength={30}
              disabled={usedCode}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="E.G. SUMMER20"
            />
            {usedCode && <span className="text-xs text-slate-400">Already used, so the code cannot change.</span>}
          </label>
          <div className="flex flex-col gap-2">
            <FormLabel>Status</FormLabel>
            <span className="flex h-14 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-700">
              {form.active ? "Active" : "Inactive"}
              <Toggle checked={form.active} onChange={(v) => set("active", v)} />
            </span>
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <FormLabel optional>Description</FormLabel>
          <textarea
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-900 placeholder-slate-400 transition focus:ring-2 focus:ring-blue-600 focus:outline-none"
            rows={2}
            maxLength={300}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. 20% off on all fashion items above ৳1000"
          />
        </label>

        <div className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FormLabel required>Discount Type</FormLabel>
            <div className="flex gap-3">
              <button type="button" className={typeButton(form.discountType === "PERCENTAGE")} onClick={() => set("discountType", "PERCENTAGE")}>
                <Percent className="h-4 w-4" /> Percentage
              </button>
              <button type="button" className={typeButton(form.discountType === "FIXED")} onClick={() => set("discountType", "FIXED")}>
                <span className="text-base leading-none">৳</span> Fixed Amount
              </button>
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <FormLabel required>Discount Value</FormLabel>
            <div className="relative">
              <input
                className={`${bigInput} bg-white pr-12 text-lg font-extrabold`}
                type="number"
                min={0}
                step="any"
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
              />
              <span className="absolute top-1/2 right-5 -translate-y-1/2 text-sm font-bold text-slate-400">{form.discountType === "PERCENTAGE" ? "%" : "৳"}</span>
            </div>
          </label>
        </div>

        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <FormLabel optional>Min Order Amount (৳)</FormLabel>
            <input className={bigInput} type="number" min={0} value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="e.g. 100" />
          </label>
          <label className="flex flex-col gap-2">
            <FormLabel optional>Max Discount Cap (৳)</FormLabel>
            <input className={bigInput} type="number" min={1} value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} placeholder="e.g. 50" />
          </label>
          <label className="flex flex-col gap-2">
            <FormLabel optional>Total Usage Limit</FormLabel>
            <input className={bigInput} type="number" min={1} step={1} value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="e.g. 500" />
          </label>
          <label className="flex flex-col gap-2">
            <FormLabel optional>Per-User Usage Limit</FormLabel>
            <input className={bigInput} type="number" min={1} step={1} value={form.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)} placeholder="e.g. 1" />
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <FormLabel icon={<Layers className="h-4 w-4 text-blue-600" />}>Promotion Scope</FormLabel>
          <div className="flex gap-3">
            {(Object.keys(SCOPE_LABELS) as CouponScope[]).map((s) => (
              <button type="button" key={s} className={scopeButton(form.scope === s)} onClick={() => set("scope", s)}>
                {SCOPE_BUTTON_LABELS[s]}
              </button>
            ))}
          </div>
          {form.scope === "CATEGORIES" && (
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 p-2">
              {categories.loading && !categories.data ? (
                <p className="p-2 text-xs text-slate-400">Loading categories...</p>
              ) : !categories.data?.length ? (
                <p className="p-2 text-xs text-slate-400">No active categories.</p>
              ) : (
                categories.data.map((c) => (
                  <label key={c._id} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(c._id)}
                      onChange={(e) => setCategoryIds((l) => (e.target.checked ? [...l, c._id] : l.filter((x) => x !== c._id)))}
                    />
                    <span className="text-slate-700">{c.path ?? c.name}</span>
                  </label>
                ))
              )}
              <p className="px-1.5 pt-1 text-[11px] text-slate-400">Sub-categories are included automatically.</p>
            </div>
          )}
          {form.scope === "PRODUCTS" && (
            <div className="flex flex-col gap-2">
              {products.map((p) => (
                <div key={p._id} className="flex items-center gap-2 rounded-2xl border border-slate-200 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbnail} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  <span className="flex-1 truncate text-xs font-semibold text-slate-700">{p.productTitle}</span>
                  <button type="button" onClick={() => setProducts((l) => l.filter((x) => x._id !== p._id))} className="cursor-pointer p-1 text-slate-400 hover:text-rose-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <ProductPicker exclude={products.map((p) => p._id)} onPick={(p) => setProducts((l) => [...l, p])} />
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <FormLabel required icon={<CalendarDays className="h-4 w-4 text-blue-600" />}>
              Start Date &amp; Time
            </FormLabel>
            <input className={bigInput} type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </label>
          <label className="flex flex-col gap-2">
            <FormLabel required icon={<CalendarDays className="h-4 w-4 text-rose-500" />}>
              Expiry Date &amp; Time
            </FormLabel>
            <input className={bigInput} type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
          </label>
        </div>
        <FieldError message={error} />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <button type="button" onClick={onClose} className="h-11 cursor-pointer rounded-xl px-5 text-sm font-bold text-slate-500 hover:bg-slate-100">
          Cancel
        </button>
        <PrimaryButton type="submit" loading={saving} className="h-11 px-6">
          {coupon ? "Save Changes" : "Create Coupon"}
        </PrimaryButton>
      </div>
    </form>
  );
}

const bigInput =
  "h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 transition focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60";

function FormLabel({ children, required, optional, icon }: { children: React.ReactNode; required?: boolean; optional?: boolean; icon?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
      {icon}
      {children}
      {required && <span className="text-rose-500">*</span>}
      {optional && <span className="font-medium text-slate-400">(Optional)</span>}
    </span>
  );
}

/** Search products and add one to the coupon. */
function ProductPicker({ exclude, onPick }: { exclude: string[]; onPick: (p: { _id: string; productTitle: string; thumbnail: string }) => void }) {
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const results = useApiQuery<Product[]>(`/products${qs({ search: q, limit: 8 })}`);
  const list = results.data?.filter((p) => !exclude.includes(p._id)) ?? [];

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-3">
      <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products to add..." />
      <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto">
        {results.loading && !results.data ? (
          <p className="p-2 text-xs text-slate-400">Loading products...</p>
        ) : !list.length ? (
          <p className="p-2 text-xs text-slate-400">No products found.</p>
        ) : (
          list.map((p) => (
            <button
              type="button"
              key={p._id}
              onClick={() => onPick({ _id: p._id, productTitle: p.productTitle, thumbnail: p.thumbnail })}
              className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-left hover:bg-blue-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbnail} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{p.productTitle}</span>
              <span className="text-[11px] text-slate-500">{formatBDT(p.finalPrice)}</span>
              <Plus className="h-4 w-4 text-blue-600" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
