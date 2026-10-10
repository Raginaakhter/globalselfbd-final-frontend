"use client";

import { useState } from "react";
import { Mail, Pencil, Phone, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { StockRequest, StockRequestStatus } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery, type Pagination } from "../../api";
import { formatShortDate } from "../../format";
import {
  EmptyState,
  ErrorBox,
  FieldError,
  Modal,
  PageHeader,
  Pager,
  PrimaryButton,
  Spinner,
  inputClass,
  labelClass,
  selectClass,
  useConfirm,
} from "../../ui";
import { StockRequestStatusBadge } from "./shared";

const STATUS_OPTIONS: { value: StockRequestStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "NOTIFIED", label: "Notified" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function StockRequestsPage() {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [status, setStatus] = useState<StockRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<StockRequest | null>(null);

  const list = useApiQuery<{ requests: StockRequest[]; pagination: Pagination }>(
    `/admin/inventory/stock-requests${qs({ status, page, limit: 20 })}`
  );

  const canUpdate = hasPermission("stockRequests.update");
  const canDelete = hasPermission("stockRequests.delete");

  const remove = async (r: StockRequest) => {
    const title = typeof r.productId === "object" ? r.productId.productTitle : "this request";
    const ok = await confirm({
      title: `Delete the request for ${title}?`,
      text: "The activity log keeps a record. This cannot be undone.",
      confirmText: "Yes, Delete",
    });
    if (!ok) return;
    const res = await action(`/admin/inventory/stock-requests/${r._id}`, { method: "DELETE" });
    if (res) list.reload();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Stock Requests"
        subtitle="Rows created whenever a customer tries to buy more than available. Each row is rate-limited to one admin email per product × customer within 30 minutes."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <select className={selectClass} value={status} onChange={(e) => { setStatus(e.target.value as StockRequestStatus | ""); setPage(1); }}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {list.loading && !list.data ? (
          <Spinner label="Loading stock requests..." />
        ) : list.error ? (
          <ErrorBox message={list.error} onRetry={list.reload} />
        ) : !list.data?.requests.length ? (
          <EmptyState title="No stock requests" text="Requests show up here when a customer tries to buy more than available." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-3 py-3.5">Product</th>
                  <th className="px-3 py-3.5">Customer</th>
                  <th className="px-3 py-3.5 text-right">Requested</th>
                  <th className="px-3 py-3.5 text-right">Available</th>
                  <th className="px-3 py-3.5 text-right">Shortage</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.data.requests.map((r) => {
                  const product = typeof r.productId === "object" ? r.productId : null;
                  const customer = typeof r.customerId === "object" ? r.customerId : null;
                  const phone = customer?.phoneNumber || r.customerPhone;
                  const email = customer?.email || r.customerEmail;
                  const name = customer?.fullName || r.customerName || "Guest";
                  return (
                    <tr key={r._id} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-3.5 text-slate-500">{formatShortDate(r.createdAt)}</td>
                      <td className="px-3 py-3.5">
                        <div className="text-sm font-bold text-slate-900">{product?.productTitle ?? "—"}</div>
                        {product?.sku && <div className="font-mono text-[10px] text-slate-500">{product.sku}</div>}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-semibold text-slate-800">{name}</div>
                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-500">
                          {phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{phone}</span>}
                          {email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold text-slate-800">{r.requestedQuantity}</td>
                      <td className="px-3 py-3.5 text-right text-slate-500">{r.availableQuantity}</td>
                      <td className="px-3 py-3.5 text-right font-bold text-rose-600">{r.shortageQuantity}</td>
                      <td className="px-3 py-3.5"><StockRequestStatusBadge value={r.status} /></td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && (
                            <button onClick={() => setEditing(r)} title="Edit" className="cursor-pointer p-1.5 text-slate-400 hover:text-amber-600">
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => remove(r)} title="Delete" className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600">
                              <Trash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={list.data?.pagination ?? null} onPage={setPage} />
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} className="max-w-md rounded-2xl">
        {editing && (
          <RequestForm
            request={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              list.reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function RequestForm({ request, onClose, onSaved }: { request: StockRequest; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [status, setStatus] = useState<StockRequestStatus>(request.status);
  const [note, setNote] = useState(request.adminNote ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await action(`/admin/inventory/stock-requests/${request._id}`, {
      method: "PUT",
      json: { status, adminNote: note.trim() },
    });
    setSaving(false);
    if (res) onSaved();
  };

  return (
    <form onSubmit={submit}>
      <header className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">Update request</h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="flex flex-col gap-4 p-5">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Status</span>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as StockRequestStatus)}>
            <option value="NEW">New</option>
            <option value="NOTIFIED">Notified</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Admin note</span>
          <textarea className={inputClass} rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called customer; new shipment ETA Thursday" />
        </label>
        <FieldError message={error} />
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-100 p-4">
        <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
        <PrimaryButton type="submit" loading={saving}>Save</PrimaryButton>
      </footer>
    </form>
  );
}
