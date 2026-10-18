"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CirclePlus, Pencil, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Banner, BannerPlacement, Status } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery } from "../api";
import { Drawer, EmptyState, ErrorBox, FieldError, PageHeader, PrimaryButton, Spinner, StatusPill, Toggle, inputClass, labelClass, useConfirm } from "../ui";
import { SingleImageField } from "./ProductMedia";

const MAX_BANNERS = 20;
const MAX_ACTIVE_PROMO = 2;

const TABS: { value: BannerPlacement; label: string; hint: string }[] = [
  { value: "HERO", label: "Big Banners", hint: "Landing page slider. Several active banners rotate." },
  { value: "PROMO", label: "Promo Cards", hint: `Small cards beside the slider. At most ${MAX_ACTIVE_PROMO} can be active at once.` },
];

export default function BannersPage() {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [placement, setPlacement] = useState<BannerPlacement>("HERO");
  const banners = useApiQuery<Banner[]>(`/banners${qs({ placement })}`);
  const [editing, setEditing] = useState<Banner | "new" | null>(null);

  const canCreate = hasPermission("banners.create");
  const canUpdate = hasPermission("banners.update");
  const canDelete = hasPermission("banners.delete");
  const list = banners.data ?? [];
  const activePromos = placement === "PROMO" ? list.filter((b) => b.status === "ACTIVE").length : 0;

  const setStatus = async (b: Banner, status: Status) => {
    const res = await action<Banner>(`/banners/${b._id}/status`, { method: "PATCH", json: { status } });
    if (res) banners.setData((l) => l?.map((x) => (x._id === b._id ? res.data : x)) ?? l);
  };

  // A banner moved to the other placement disappears from this tab.
  const onSaved = () => banners.reload();

  const move = async (index: number, dir: -1 | 1) => {
    const ids = list.map((b) => b._id);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    const res = await action<Banner[]>("/banners/reorder", { method: "PATCH", json: { ids } }, "Order updated");
    if (res) banners.setData(res.data);
  };

  const remove = async (b: Banner) => {
    const ok = await confirm({ title: "Delete banner?", text: `"${b.title || b.altText || "Untitled banner"}" will be removed from the website.`, confirmText: "Yes, Delete" });
    if (ok && (await action(`/banners/${b._id}`, { method: "DELETE" }))) banners.reload();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Banners" subtitle={`Big banners and promo cards on the landing page. Only the image is required; text and button are optional. Up to ${MAX_BANNERS} banners.`}>
        {canCreate && (
          <PrimaryButton onClick={() => setEditing("new")} disabled={list.length >= MAX_BANNERS}>
            <CirclePlus className="mr-2 h-4 w-4" /> {placement === "PROMO" ? "Add Promo Card" : "Add Banner"}
          </PrimaryButton>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setPlacement(t.value)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition ${placement === t.value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.label}
          </button>
        ))}
        <span className="px-2 text-xs text-slate-500">
          {TABS.find((t) => t.value === placement)?.hint}
          {placement === "PROMO" && ` (${activePromos}/${MAX_ACTIVE_PROMO} active)`}
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {banners.loading && !banners.data ? (
          <Spinner label="Loading banners..." />
        ) : banners.error ? (
          <ErrorBox message={banners.error} onRetry={banners.reload} />
        ) : !list.length ? (
          <EmptyState title={placement === "PROMO" ? "No promo cards yet" : "No banners yet"} text={placement === "PROMO" ? "Add up to 2 promo cards to show beside the slider." : "Add a banner to show it in the landing page slider."} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((b, i) => (
              <li key={b._id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-extrabold text-slate-400">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt={b.altText} className={`w-full rounded-xl border border-slate-200 object-cover sm:w-56 ${b.placement === "PROMO" ? "aspect-[2/1]" : "aspect-[16/7]"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{b.title || <span className="text-slate-400 italic">No title (image only)</span>}</p>
                  {b.subtitle && <p className="truncate text-xs text-slate-500">{b.subtitle}</p>}
                  {(b.buttonText || b.buttonLink) && (
                    <p className="mt-1 truncate text-xs text-blue-600">
                      {b.buttonText || "Whole banner"} → {b.buttonLink || "—"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canUpdate && <Toggle checked={b.status === "ACTIVE"} onChange={(v) => setStatus(b, v ? "ACTIVE" : "INACTIVE")} />}
                  {b.status && <StatusPill value={b.status} />}
                </div>
                <div className="flex items-center gap-1">
                  {canUpdate && (
                    <>
                      <button disabled={i === 0} onClick={() => move(i, -1)} title="Move up" className="cursor-pointer p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-30">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button disabled={i === list.length - 1} onClick={() => move(i, 1)} title="Move down" className="cursor-pointer p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-30">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditing(b)} title="Edit" className="cursor-pointer p-1.5 text-slate-400 hover:text-amber-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button onClick={() => remove(b)} title="Delete" className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600">
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <BannerForm key={editing === "new" ? `new-${placement}` : editing._id} banner={editing === "new" ? null : editing} placement={placement} onClose={() => setEditing(null)} onSaved={onSaved} />
        )}
      </Drawer>
    </div>
  );
}

const TEXT_FIELDS = [
  { key: "title", label: "Title" },
  { key: "subtitle", label: "Subtitle" },
  { key: "buttonText", label: "Button text" },
  { key: "buttonLink", label: "Button link", placeholder: "/shop or https://..." },
  { key: "altText", label: "Alt text (for screen readers)" },
] as const;

function BannerForm({ banner, placement, onClose, onSaved }: { banner: Banner | null; placement: BannerPlacement; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [form, setForm] = useState({
    placement: banner?.placement ?? placement,
    imageUrl: banner?.imageUrl ?? "",
    mobileImageUrl: banner?.mobileImageUrl ?? "",
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    description: banner?.description ?? "",
    buttonText: banner?.buttonText ?? "",
    buttonLink: banner?.buttonLink ?? "",
    altText: banner?.altText ?? "",
    status: banner?.status ?? "ACTIVE",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) return setError("Upload the banner image first.");
    const link = form.buttonLink.trim();
    if (link && !link.startsWith("/") && !/^https?:\/\//i.test(link)) return setError('Button link must start with "/" or http(s)://');
    setError("");
    setSaving(true);
    const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
    const res = banner ? await action(`/banners/${banner._id}`, { method: "PUT", json: body }) : await action("/banners", { method: "POST", json: body });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">{banner ? "Edit" : "New"} {form.placement === "PROMO" ? "Promo Card" : "Banner"}</h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Placement</span>
          <select className={inputClass} value={form.placement} onChange={(e) => set("placement")(e.target.value)}>
            <option value="HERO">Big banner (slider)</option>
            <option value="PROMO">Promo card (beside the slider, max 2 active)</option>
          </select>
        </label>
        <SingleImageField
          label="Banner image * (desktop / tablet)"
          value={form.imageUrl}
          onChange={set("imageUrl")}
          folder="banners"
          wide
          removable={false}
          hint={form.placement === "PROMO"
            ? "16:9 ratio — recommended 800×450 (min 640×360). Max 5MB. Anything off-ratio will be cropped."
            : "16:9 ratio — recommended 1920×1080 (min 1280×720). Max 5MB. Anything off-ratio will be cropped."}
        />
        <SingleImageField
          label="Mobile image (optional, shown on phones ≤ 640px wide)"
          value={form.mobileImageUrl}
          onChange={set("mobileImageUrl")}
          folder="banners"
          wide
          hint={form.placement === "PROMO"
            ? "16:9 ratio — recommended 640×360 (min 480×270). Max 5MB."
            : "16:9 ratio — recommended 750×420 (min 640×360). Max 5MB."}
        />
        <p className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">Everything below is optional. Leave it empty to show the image only.</p>
        {TEXT_FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1.5">
            <span className={labelClass}>{f.label}</span>
            <input className={inputClass} value={form[f.key]} placeholder={"placeholder" in f ? f.placeholder : undefined} onChange={(e) => set(f.key)(e.target.value)} />
          </label>
        ))}
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Description</span>
          <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => set("description")(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Status</span>
          <select className={inputClass} value={form.status} onChange={(e) => set("status")(e.target.value)}>
            <option value="ACTIVE">Active (shown on the website)</option>
            <option value="INACTIVE">Inactive (hidden)</option>
          </select>
        </label>
        <FieldError message={error} />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
        <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          Cancel
        </button>
        <PrimaryButton type="submit" loading={saving}>
          {banner ? "Save Changes" : "Create Banner"}
        </PrimaryButton>
      </div>
    </form>
  );
}
