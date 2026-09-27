"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, Reply, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { ContactMessage, ContactStatus, ContactSummary } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery } from "../api";
import { EmptyState, ErrorBox, Drawer, PageHeader, Pager, SearchBox, Spinner, StatusPill, selectClass, useConfirm, useDebounced } from "../ui";
import { formatDateTime } from "./orderShared";

export default function ContactMessagesPage() {
  const { api, hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<ContactMessage | null>(null);
  const [summary, setSummary] = useState<ContactSummary | null>(null);
  const q = useDebounced(search);
  const messages = useApiQuery<ContactMessage[]>(`/contact-messages${qs({ search: q, status, page })}`);
  const canUpdate = hasPermission("contactMessages.update");

  // The counts come next to `data` in the response, so they are loaded separately.
  useEffect(() => {
    api<ContactMessage[]>(`/contact-messages${qs({ limit: 1 })}`)
      .then((res) => setSummary((res as unknown as { summary?: ContactSummary }).summary ?? null))
      .catch(() => setSummary(null));
  }, [api, messages.data]);

  const replace = (m: ContactMessage) => {
    messages.setData((l) => l?.map((x) => (x._id === m._id ? m : x)) ?? l);
    setOpen((o) => (o?._id === m._id ? m : o));
  };

  const setMessageStatus = async (m: ContactMessage, next: ContactStatus, quiet = false) => {
    const res = quiet
      ? await api<ContactMessage>(`/contact-messages/${m._id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) }).catch(() => null)
      : await action<ContactMessage>(`/contact-messages/${m._id}/status`, { method: "PATCH", json: { status: next } });
    if (res) replace(res.data);
  };

  const view = (m: ContactMessage) => {
    setOpen(m);
    // Opening a new message marks it as read
    if (m.status === "NEW" && canUpdate) void setMessageStatus(m, "READ", true);
  };

  const remove = async (m: ContactMessage) => {
    const ok = await confirm({ title: "Delete this message?", text: `From ${m.name} (${m.email}).`, confirmText: "Yes, Delete" });
    if (ok && (await action(`/contact-messages/${m._id}`, { method: "DELETE" }))) {
      setOpen(null);
      messages.reload();
    }
  };

  const stat = (label: string, value?: number, tone = "text-slate-900") => (
    <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
      <p className={`text-2xl font-extrabold ${tone}`}>{value ?? "—"}</p>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Contact Messages" subtitle="Messages sent from the Contact Us page on the website." />

      <div className="flex flex-col gap-3 sm:flex-row">
        {stat("New", summary?.new, "text-sky-700")}
        {stat("Read", summary?.read, "text-slate-500")}
        {stat("Replied", summary?.replied, "text-emerald-700")}
        {stat("Total", summary?.total)}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, email, phone or subject..."
        />
        <select
          className={selectClass}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All messages</option>
          <option value="NEW">New</option>
          <option value="READ">Read</option>
          <option value="REPLIED">Replied</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {messages.loading && !messages.data ? (
          <Spinner label="Loading messages..." />
        ) : messages.error ? (
          <ErrorBox message={messages.error} onRetry={messages.reload} />
        ) : !messages.data?.length ? (
          <EmptyState title="No messages found" text={search || status ? "No message matches your filters." : "Messages from the website's contact form appear here."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">From</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Received</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages.data.map((m) => (
                  <tr key={m._id} onClick={() => view(m)} className={`cursor-pointer transition hover:bg-slate-50/60 ${m.status === "NEW" ? "bg-sky-50/40" : ""}`}>
                    <td className="px-6 py-4">
                      <div className={`text-sm text-slate-900 ${m.status === "NEW" ? "font-extrabold" : "font-semibold"}`}>{m.name}</div>
                      <div className="text-slate-500">{m.email}</div>
                    </td>
                    <td className="max-w-xs px-4 py-4">
                      <div className="truncate font-semibold text-slate-800">{m.subject}</div>
                      <div className="truncate text-slate-400">{m.message}</div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill value={m.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-500">{formatDateTime(m.createdAt)}</td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {hasPermission("contactMessages.delete") && (
                        <button onClick={() => remove(m)} title="Delete" className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600">
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={messages.pagination} onPage={setPage} />
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold break-words text-slate-900">{open.subject}</h2>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(open.createdAt)}</p>
              </div>
              <button onClick={() => setOpen(null)} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
              <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200 p-4 text-sm">
                <div className="font-bold text-slate-900">
                  {open.name}
                  {open.userId && <span className="ml-2 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Customer</span>}
                </div>
                <a href={`mailto:${open.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                  <Mail className="h-4 w-4" /> {open.email}
                </a>
                {open.phone && (
                  <a href={`tel:${open.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Phone className="h-4 w-4" /> {open.phone}
                  </a>
                )}
              </div>
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-700">{open.message}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <StatusPill value={open.status} />
                {canUpdate && (
                  <select className={selectClass} value={open.status} onChange={(e) => setMessageStatus(open, e.target.value as ContactStatus)}>
                    <option value="NEW">Mark as new</option>
                    <option value="READ">Mark as read</option>
                    <option value="REPLIED">Mark as replied</option>
                  </select>
                )}
              </div>
              <a
                href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}
                onClick={() => canUpdate && open.status !== "REPLIED" && void setMessageStatus(open, "REPLIED", true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
              >
                <Reply className="h-4 w-4" /> Reply by email
              </a>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
