"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Download, Eye, Mail, Pencil, Plus, Send, Trash, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type {
  CampaignPreview,
  CampaignProduct,
  CampaignType,
  NewsletterCampaign,
  NewsletterSubscriber,
  Product,
  SubscriberSummary,
} from "@/lib/backend-types";
import { errorMessage, qs, useApiAction, useApiQuery } from "../api";
import { formatShortDate, formatTaka } from "../format";
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
  inputClass,
  labelClass,
  selectClass,
  useConfirm,
  useDebounced,
} from "../ui";

const TYPE_LABELS: Record<CampaignType, string> = {
  NEW_PRODUCT: "New products",
  OFFER: "Offer / discount",
  ANNOUNCEMENT: "Announcement",
};

const MAX_PRODUCTS = 6;

export default function NewsletterPage() {
  const [tab, setTab] = useState<"campaigns" | "subscribers">("campaigns");
  const tabBtn = (key: typeof tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition ${tab === key ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:bg-slate-100"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Newsletter" subtitle="Email offers and new products to everyone who subscribed on the website.">
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1">
          {tabBtn("campaigns", "Campaigns")}
          {tabBtn("subscribers", "Subscribers")}
        </div>
      </PageHeader>
      {tab === "campaigns" ? <CampaignsTab /> : <SubscribersTab />}
    </div>
  );
}

/* ---------- Campaigns ---------- */

function CampaignsTab() {
  const { api, hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<NewsletterCampaign | "new" | null>(null);
  const [previewing, setPreviewing] = useState<NewsletterCampaign | null>(null);
  const campaigns = useApiQuery<NewsletterCampaign[]>(`/newsletter/campaigns${qs({ status, page })}`);
  const canSend = hasPermission("newsletter.send");

  // While a campaign is sending, refresh every 3 seconds to show progress.
  const { reload } = campaigns;
  const sending = campaigns.data?.some((c) => c.status === "SENDING");
  useEffect(() => {
    if (!sending) return;
    const id = setInterval(reload, 3000);
    return () => clearInterval(id);
  }, [sending, reload]);

  const edit = async (c: NewsletterCampaign) => {
    // The list has no product details; load the full campaign for the form.
    try {
      setEditing((await api<NewsletterCampaign>(`/newsletter/campaigns/${c._id}`)).data);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (c: NewsletterCampaign) => {
    const ok = await confirm({
      title: `Delete "${c.subject}"?`,
      text: c.status === "SENT" ? "Only the history is removed. Emails already sent stay in inboxes." : "The draft will be deleted.",
      confirmText: "Yes, Delete",
    });
    if (ok && (await action(`/newsletter/campaigns/${c._id}`, { method: "DELETE" }))) campaigns.reload();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <select
          className={selectClass}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All campaigns</option>
          <option value="DRAFT">Drafts</option>
          <option value="SENDING">Sending</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
        {canSend && (
          <PrimaryButton onClick={() => setEditing("new")}>
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </PrimaryButton>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {campaigns.loading && !campaigns.data ? (
          <Spinner label="Loading campaigns..." />
        ) : campaigns.error ? (
          <ErrorBox message={campaigns.error} onRetry={campaigns.reload} />
        ) : !campaigns.data?.length ? (
          <EmptyState title="No campaigns yet" text="Create a campaign, pick the products to show, preview it, send yourself a test, then send it to all subscribers." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Campaign</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Delivery</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.data.map((c) => (
                  <tr key={c._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{c.subject}</div>
                      <div className="text-slate-500">
                        {TYPE_LABELS[c.type]} · {c.productIds.length} product{c.productIds.length === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill value={c.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                      {c.status === "DRAFT" ? (
                        "—"
                      ) : (
                        <>
                          <b className="text-emerald-700">{c.sentCount}</b> / {c.recipients} sent
                          {c.failedCount > 0 && <span className="ml-1 font-semibold text-rose-600">· {c.failedCount} failed</span>}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-500">{formatShortDate(c.sentAt ?? c.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setPreviewing(c)} title={c.status === "DRAFT" && canSend ? "Preview, test & send" : "Preview"} className="cursor-pointer p-1.5 text-slate-400 hover:text-blue-600">
                          {c.status === "DRAFT" && canSend ? <Send className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        {canSend && c.status === "DRAFT" && (
                          <button onClick={() => edit(c)} title="Edit" className="cursor-pointer p-1.5 text-slate-400 hover:text-amber-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canSend && c.status !== "SENDING" && (
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
        <Pager pagination={campaigns.pagination} onPage={setPage} />
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <CampaignForm
            key={editing === "new" ? "new" : editing._id}
            campaign={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={(c) => {
              campaigns.reload();
              setPreviewing(c);
            }}
          />
        )}
      </Drawer>

      <Modal open={!!previewing} onClose={() => setPreviewing(null)} className="max-w-3xl">
        {previewing && (
          <CampaignPreviewPanel
            campaign={previewing}
            canSend={canSend}
            onClose={() => setPreviewing(null)}
            onSent={() => {
              setPreviewing(null);
              campaigns.reload();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function CampaignForm({ campaign, onClose, onSaved }: { campaign: NewsletterCampaign | null; onClose: () => void; onSaved: (c: NewsletterCampaign) => void }) {
  const action = useApiAction();
  const [form, setForm] = useState({
    type: campaign?.type ?? ("NEW_PRODUCT" as CampaignType),
    subject: campaign?.subject ?? "",
    heading: campaign?.heading ?? "",
    message: campaign?.message ?? "",
    buttonText: campaign?.buttonText ?? "",
    buttonLink: campaign?.buttonLink ?? "",
  });
  const [products, setProducts] = useState<CampaignProduct[]>(campaign?.products ?? []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const move = (i: number, dir: -1 | 1) =>
    setProducts((list) => {
      const next = [...list];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      subject: form.subject.trim(),
      heading: form.heading.trim(),
      message: form.message.trim(),
      buttonText: form.buttonText.trim(),
      buttonLink: form.buttonLink.trim(),
      productIds: products.map((p) => p._id),
    };
    if (!body.subject) return setError("Email subject is required.");
    if (!body.message && !body.productIds.length) return setError("Write a message or pick at least one product.");
    if (Boolean(body.buttonText) !== Boolean(body.buttonLink)) return setError("Fill in both button text and button link, or leave both empty.");
    if (body.buttonLink && !body.buttonLink.startsWith("/") && !/^https?:\/\//i.test(body.buttonLink)) return setError('Button link must start with "/" or http(s)://');
    setError("");
    setSaving(true);
    const res = campaign
      ? await action<NewsletterCampaign>(`/newsletter/campaigns/${campaign._id}`, { method: "PUT", json: body })
      : await action<NewsletterCampaign>("/newsletter/campaigns", { method: "POST", json: body }, "Draft saved. Check the preview, then send.");
    setSaving(false);
    if (res) {
      onClose();
      onSaved(res.data);
    }
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">{campaign ? "Edit Campaign" : "New Campaign"}</h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Email type *</span>
          <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as CampaignType)}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Subject * <span className="font-normal text-slate-400">(what people see in their inbox)</span></span>
          <input className={inputClass} maxLength={150} value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Eid offer: up to 30% off" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Heading</span>
          <input className={inputClass} maxLength={150} value={form.heading} onChange={(e) => set("heading", e.target.value)} placeholder="Uses the subject if empty" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Message</span>
          <textarea className={inputClass} rows={5} maxLength={3000} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Leave an empty line between paragraphs." />
        </label>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>
            Products to show ({products.length}/{MAX_PRODUCTS})
          </span>
          {products.map((p, i) => (
            <div key={p._id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-800">{p.productTitle}</div>
                <div className="text-[11px] text-slate-500">{formatTaka(p.customerSpecialPrice ?? p.customerSellPrice)}</div>
              </div>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} title="Move up" className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" disabled={i === products.length - 1} onClick={() => move(i, 1)} title="Move down" className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setProducts((l) => l.filter((x) => x._id !== p._id))} title="Remove" className="cursor-pointer p-1 text-slate-400 hover:text-rose-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {products.length < MAX_PRODUCTS && <ProductPicker exclude={products.map((p) => p._id)} onPick={(p) => setProducts((l) => [...l, p])} />}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Button text</span>
            <input className={inputClass} maxLength={40} value={form.buttonText} onChange={(e) => set("buttonText", e.target.value)} placeholder="Shop the offer" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Button link</span>
            <input className={inputClass} value={form.buttonLink} onChange={(e) => set("buttonLink", e.target.value)} placeholder="/shop" />
          </label>
        </div>
        <FieldError message={error} />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
        <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          Cancel
        </button>
        <PrimaryButton type="submit" loading={saving}>
          {campaign ? "Save & Preview" : "Save Draft & Preview"}
        </PrimaryButton>
      </div>
    </form>
  );
}

/** Search active products and add one to the campaign. */
function ProductPicker({ exclude, onPick }: { exclude: string[]; onPick: (p: CampaignProduct) => void }) {
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const results = useApiQuery<Product[]>(`/products${qs({ status: "ACTIVE", search: q, limit: 8 })}`);
  const list = results.data?.filter((p) => !exclude.includes(p._id)) ?? [];

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-3">
      <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products to add..." />
      <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
        {results.loading && !results.data ? (
          <p className="p-2 text-xs text-slate-400">Loading products...</p>
        ) : results.error ? (
          <p className="p-2 text-xs text-rose-500">{results.error}</p>
        ) : !list.length ? (
          <p className="p-2 text-xs text-slate-400">No active products found.</p>
        ) : (
          list.map((p) => (
            <button
              type="button"
              key={p._id}
              onClick={() => onPick({ _id: p._id, productTitle: p.productTitle, slug: p.slug, thumbnail: p.thumbnail, customerSellPrice: p.customerSellPrice, customerSpecialPrice: p.customerSpecialPrice, status: p.status })}
              className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-left hover:bg-emerald-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbnail} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{p.productTitle}</span>
              <span className="text-[11px] text-slate-500">{formatTaka(p.finalPrice)}</span>
              <Plus className="h-4 w-4 text-emerald-600" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function CampaignPreviewPanel({ campaign, canSend, onClose, onSent }: { campaign: NewsletterCampaign; canSend: boolean; onClose: () => void; onSent: () => void }) {
  const { user } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const preview = useApiQuery<CampaignPreview>(`/newsletter/campaigns/${campaign._id}/preview`);
  const subscribers = useApiQuery<NewsletterSubscriber[]>(canSend && campaign.status === "DRAFT" ? `/newsletter/subscribers${qs({ status: "SUBSCRIBED", limit: 1 })}` : null);
  const [testEmail, setTestEmail] = useState(user?.email ?? "");
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const count = subscribers.pagination?.total ?? 0;

  const sendTest = async () => {
    setTesting(true);
    await action(`/newsletter/campaigns/${campaign._id}/test`, { method: "POST", json: testEmail.trim() ? { email: testEmail.trim() } : {} });
    setTesting(false);
  };

  const sendAll = async () => {
    const ok = await confirm({
      title: `Send to ${count} subscriber${count === 1 ? "" : "s"}?`,
      text: "This cannot be undone. A campaign can only be sent once.",
      confirmText: "Yes, Send Now",
      tone: "primary",
      icon: "question",
    });
    if (!ok) return;
    setSending(true);
    const res = await action(`/newsletter/campaigns/${campaign._id}/send`, { method: "POST" });
    setSending(false);
    if (res) onSent();
  };

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Subject</p>
          <h2 className="truncate text-lg font-extrabold text-slate-900">{preview.data?.subject ?? campaign.subject}</h2>
        </div>
        <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
        {preview.loading && !preview.data ? (
          <Spinner label="Building preview..." />
        ) : preview.error ? (
          <ErrorBox message={preview.error} onRetry={preview.reload} />
        ) : (
          // sandbox: the email HTML cannot run scripts or touch the dashboard
          <iframe title="Email preview" sandbox="" srcDoc={preview.data?.html} className="h-[60vh] w-full border-0 bg-white" />
        )}
      </div>

      {canSend && campaign.status === "DRAFT" && (
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <input className={`${inputClass} py-2`} type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Test email address" />
            <button
              onClick={sendTest}
              disabled={testing}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Mail className="h-4 w-4" /> {testing ? "Sending..." : "Send test"}
            </button>
          </div>
          <PrimaryButton onClick={sendAll} loading={sending} disabled={!count || subscribers.loading}>
            <Send className="mr-2 h-4 w-4" />
            {subscribers.loading ? "Counting..." : count ? `Send to ${count} subscriber${count === 1 ? "" : "s"}` : "No subscribers yet"}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* ---------- Subscribers ---------- */

interface SubscribersResponse {
  data: NewsletterSubscriber[];
  summary?: SubscriberSummary;
}

function SubscribersTab() {
  const { api, accessToken, hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<SubscriberSummary | null>(null);
  const [exporting, setExporting] = useState(false);
  const q = useDebounced(search);
  const path = `/newsletter/subscribers${qs({ search: q, status, page })}`;
  const subscribers = useApiQuery<NewsletterSubscriber[]>(path);

  // The totals come next to `data` in the response, so they are loaded separately.
  useEffect(() => {
    api<NewsletterSubscriber[]>(`/newsletter/subscribers${qs({ limit: 1 })}`)
      .then((res) => setSummary((res as unknown as SubscribersResponse).summary ?? null))
      .catch(() => setSummary(null));
  }, [api, subscribers.data]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/v1/newsletter/subscribers/export${qs({ status: status || "SUBSCRIBED", search: q })}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `Export failed (${res.status})`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorMessage(err, "Export failed"));
    } finally {
      setExporting(false);
    }
  };

  const remove = async (s: NewsletterSubscriber) => {
    const ok = await confirm({ title: `Delete ${s.email}?`, text: "They will stop getting newsletters. They can subscribe again from the website.", confirmText: "Yes, Delete" });
    if (ok && (await action(`/newsletter/subscribers/${s._id}`, { method: "DELETE" }))) subscribers.reload();
  };

  const stat = (label: string, value?: number, tone = "text-slate-900") => (
    <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
      <p className={`text-2xl font-extrabold ${tone}`}>{value ?? "—"}</p>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        {stat("Subscribed", summary?.subscribed, "text-emerald-700")}
        {stat("Unsubscribed", summary?.unsubscribed, "text-slate-500")}
        {stat("Total", summary?.total)}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by email..."
        />
        <select
          className={selectClass}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="SUBSCRIBED">Subscribed</option>
          <option value="UNSUBSCRIBED">Unsubscribed</option>
        </select>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="ml-auto inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {subscribers.loading && !subscribers.data ? (
          <Spinner label="Loading subscribers..." />
        ) : subscribers.error ? (
          <ErrorBox message={subscribers.error} onRetry={subscribers.reload} />
        ) : !subscribers.data?.length ? (
          <EmptyState title="No subscribers found" text={search ? "No email matches your search." : "Emails entered in the website's newsletter form appear here."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Subscribed</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscribers.data.map((s) => (
                  <tr key={s._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {s.email}
                      {s.userId && <span className="ml-2 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Customer</span>}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill value={s.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{s.source}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-500">{formatShortDate(s.subscribedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      {hasPermission("newsletter.delete") && (
                        <button onClick={() => remove(s)} title="Delete" className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600">
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
        <Pager pagination={subscribers.pagination} onPage={setPage} />
      </div>
    </>
  );
}
