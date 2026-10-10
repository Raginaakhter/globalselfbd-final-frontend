"use client";

import { useState } from "react";
import { CirclePlus, Pencil, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Supplier, SupplierStatus } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery, type Pagination } from "../../api";
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
} from "../../ui";

export default function SuppliersPage() {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SupplierStatus | "">("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Supplier | "new" | null>(null);
  const q = useDebounced(search);
  const list = useApiQuery<{ suppliers: Supplier[]; pagination: Pagination }>(
    `/admin/inventory/suppliers${qs({ search: q, status, page, limit: 20 })}`
  );

  const canUpdate = hasPermission("suppliers.update");

  const remove = async (s: Supplier) => {
    const ok = await confirm({
      title: `Delete "${s.name}"?`,
      text: "If this supplier has shipments or lots, it will be deactivated instead.",
      confirmText: "Yes, Delete",
    });
    if (!ok) return;
    const res = await action(`/admin/inventory/suppliers/${s._id}`, { method: "DELETE" });
    if (res) list.reload();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Suppliers" subtitle="Vendors that ship inventory to your warehouse.">
        {hasPermission("suppliers.create") && (
          <PrimaryButton onClick={() => setEditing("new")}>
            <CirclePlus className="mr-2 h-4 w-4" /> Add Supplier
          </PrimaryButton>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, contact or phone..." />
        <select className={selectClass} value={status} onChange={(e) => { setStatus(e.target.value as SupplierStatus | ""); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {list.loading && !list.data ? (
          <Spinner label="Loading suppliers..." />
        ) : list.error ? (
          <ErrorBox message={list.error} onRetry={list.reload} />
        ) : !list.data?.suppliers.length ? (
          <EmptyState title="No suppliers" text="Add your first supplier before creating a shipment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-3 py-3.5">Contact person</th>
                  <th className="px-3 py-3.5">Phone</th>
                  <th className="px-3 py-3.5">Email</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.data.suppliers.map((s) => (
                  <tr key={s._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{s.name}</div>
                      {s.address && <div className="max-w-xs truncate text-[11px] text-slate-500">{s.address}</div>}
                    </td>
                    <td className="px-3 py-4 text-slate-600">{s.contactPerson || "—"}</td>
                    <td className="px-3 py-4 text-slate-600">{s.phone || "—"}</td>
                    <td className="px-3 py-4 text-slate-600">{s.email || "—"}</td>
                    <td className="px-3 py-4"><StatusPill value={s.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <button onClick={() => setEditing(s)} title="Edit" className="cursor-pointer p-1.5 text-slate-400 hover:text-amber-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission("suppliers.delete") && (
                          <button onClick={() => remove(s)} title="Delete" className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600">
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
        <Pager pagination={list.data?.pagination ?? null} onPage={setPage} />
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <SupplierForm
            key={editing === "new" ? "new" : editing._id}
            supplier={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={list.reload}
          />
        )}
      </Drawer>
    </div>
  );
}

function SupplierForm({ supplier, onClose, onSaved }: { supplier: Supplier | null; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    contactPerson: supplier?.contactPerson ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
    notes: supplier?.notes ?? "",
    status: supplier?.status ?? "ACTIVE",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required.");
    setError("");
    setSaving(true);
    const body = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      status: form.status,
    };
    const res = supplier
      ? await action(`/admin/inventory/suppliers/${supplier._id}`, { method: "PUT", json: body })
      : await action("/admin/inventory/suppliers", { method: "POST", json: body });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">{supplier ? "Edit Supplier" : "New Supplier"}</h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Name *</span>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Contact person</span>
          <input className={inputClass} value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Phone</span>
            <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Email</span>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Address</span>
          <textarea className={inputClass} rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Notes</span>
          <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </label>
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
          <span className={labelClass}>Active</span>
          <Toggle checked={form.status === "ACTIVE"} onChange={(v) => set("status", v ? "ACTIVE" : "INACTIVE")} />
        </label>
        <FieldError message={error} />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
        <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
        <PrimaryButton type="submit" loading={saving}>{supplier ? "Save changes" : "Create supplier"}</PrimaryButton>
      </div>
    </form>
  );
}
