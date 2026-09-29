"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, CircleCheck, CircleX, Clock, ExternalLink, Eye, EyeOff, Filter, History, House, Loader2, Package, RefreshCw, Star, Trash, UserRound, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminReview, AdminReviewSummary, Product, ReviewAuditEntry, ReviewProductRef, ReviewStatus } from "@/lib/backend-types";
import { BASE } from "../AppSidebar";
import { qs, useApiAction, useApiQuery } from "../api";
import { EmptyState, ErrorBox, Modal, Pager, SearchBox, Spinner, selectClass, useDebounced } from "../ui";

type Chip = { key: string; label: string; status?: ReviewStatus; homepage?: boolean; count?: (s: AdminReviewSummary) => number };

const CHIPS: Chip[] = [
  { key: "all", label: "All", count: (s) => s.total },
  { key: "pending", label: "Pending", status: "PENDING", count: (s) => s.pending },
  { key: "approved", label: "Published", status: "APPROVED", count: (s) => s.approved },
  { key: "hidden", label: "Hidden", status: "HIDDEN", count: (s) => s.hidden },
  { key: "rejected", label: "Rejected", status: "REJECTED", count: (s) => s.rejected },
  { key: "homepage", label: "On Homepage", homepage: true, count: (s) => s.onHomepage },
];

const STATUS_STYLE: Record<ReviewStatus, { label: string; tone: string; icon: typeof CircleCheck }> = {
  PENDING: { label: "Pending", tone: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  APPROVED: { label: "Published", tone: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CircleCheck },
  HIDDEN: { label: "Hidden", tone: "border-slate-200 bg-slate-100 text-slate-600", icon: EyeOff },
  REJECTED: { label: "Rejected", tone: "border-rose-200 bg-rose-50 text-rose-700", icon: CircleX },
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function RatingStars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5 whitespace-nowrap">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
      ))}
      <span className="ml-1.5 text-xs font-bold text-slate-600">({value})</span>
    </span>
  );
}

function ReviewStatusPill({ status }: { status: ReviewStatus }) {
  const { label, tone, icon: Icon } = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold tracking-wider whitespace-nowrap uppercase ${tone}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function ProductThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <Star className="h-5 w-5 text-slate-300" />}
    </span>
  );
}

export default function ReviewsPage() {
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("all");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const [managing, setManaging] = useState<AdminReview | null>(null);
  // Bumped after product changes so an open details modal reloads
  const [detailsKey, setDetailsKey] = useState(0);
  const q = useDebounced(search);
  const active = CHIPS.find((c) => c.key === chip) ?? CHIPS[0];

  const reviews = useApiQuery<AdminReview[]>(
    `/admin/reviews${qs({ search: q, status: active.status, showOnHomepage: active.homepage ? "true" : undefined, rating, sort, page, limit: 20 })}`
  );
  const summary = reviews.response?.summary as AdminReviewSummary | undefined;
  const canUpdate = hasPermission("reviews.update");
  const canDelete = hasPermission("reviews.delete");

  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };

  // Status or homepage changes can move a review out of the current filter, so reload the list and counts
  const run = async (id: string, call: () => Promise<unknown>) => {
    setBusyId(id);
    if (await call()) await reviews.reload();
    setBusyId(null);
  };
  const setStatus = (r: AdminReview, status: ReviewStatus) => run(r._id, () => action(`/admin/reviews/${r._id}/status`, { method: "PATCH", json: { status } }));
  const setHomepage = (r: AdminReview, showOnHomepage: boolean) =>
    run(r._id, () => action(`/admin/reviews/${r._id}/homepage`, { method: "PATCH", json: { showOnHomepage } }));
  const remove = async (r: AdminReview) => {
    await run(r._id, () => action(`/admin/reviews/${r._id}`, { method: "DELETE" }));
    setDeleting(null);
    if (viewing === r._id) setViewing(null);
  };

  const actionButton = "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
              <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Reviews</h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">Manage customer feedback: approve, hide or reject reviews and pick the ones shown on the homepage.</p>
        </div>
        <button
          onClick={reviews.reload}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700"
        >
          <RefreshCw className={`h-4 w-4 ${reviews.loading ? "animate-spin" : ""}`} /> Refresh Reviews
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs xl:flex-row xl:items-center">
        <div className="w-full xl:max-w-md">
          <SearchBox value={search} onChange={(v) => reset(() => setSearch(v))} placeholder="Search customer, product, order number or comment..." />
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Filter className="mr-1 h-5 w-5 text-slate-400" />
          {CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => reset(() => setChip(c.key))}
              className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-bold transition ${
                chip === c.key ? "bg-slate-900 text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c.label}
              {summary && c.count && <span className={`text-xs ${chip === c.key ? "text-white/70" : "text-slate-400"}`}>{c.count(summary)}</span>}
            </button>
          ))}
          <select className={`${selectClass} h-10 rounded-full`} value={rating} onChange={(e) => reset(() => setRating(e.target.value))}>
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          <select className={`${selectClass} h-10 rounded-full`} value={sort} onChange={(e) => reset(() => setSort(e.target.value))}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="ratingHigh">Highest rating</option>
            <option value="ratingLow">Lowest rating</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {reviews.loading && !reviews.data ? (
          <Spinner label="Loading reviews..." />
        ) : reviews.error ? (
          <ErrorBox message={reviews.error} onRetry={reviews.reload} />
        ) : !reviews.data?.length ? (
          <EmptyState title="No reviews found" text={search || chip !== "all" || rating ? "No review matches your filters." : "Customers can review products after their order is delivered."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Rating</th>
                  <th className="px-4 py-4">Homepage</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.data.map((r) => {
                  const busy = busyId === r._id;
                  return (
                    <tr key={r._id} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="font-bold whitespace-nowrap text-slate-900">{r.customerName}</div>
                        {r.customerEmail && <div className="font-mono text-xs text-slate-400">{r.customerEmail}</div>}
                        <div className="font-mono text-[11px] text-slate-400">{r.orderNumber}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-[260px] items-center gap-3">
                          <ProductThumb src={r.productImage} alt={r.productTitle} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-bold text-slate-900">{r.productTitle}</span>
                              {r.associatedProducts?.length > 0 && (
                                <span
                                  title={r.associatedProducts.map((x) => x.productTitle).join(", ")}
                                  className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-indigo-700"
                                >
                                  +{r.associatedProducts.length} more
                                </span>
                              )}
                            </div>
                            {r.comment && <div className="truncate text-xs text-slate-500">&ldquo;{r.comment}&rdquo;</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RatingStars value={r.rating} />
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold whitespace-nowrap ${
                            r.showOnHomepage ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {r.showOnHomepage ? "ON HOMEPAGE" : "PRODUCT PAGE"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <ReviewStatusPill status={r.status} />
                      </td>
                      <td className="px-4 py-4 font-mono text-xs whitespace-nowrap text-slate-500">{formatDate(r.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setViewing(r._id)} title="View review" className={`${actionButton} bg-blue-50 text-blue-600 hover:bg-blue-100`}>
                            <Eye className="h-4 w-4" />
                          </button>
                          {canUpdate && (
                            <>
                              <button
                                onClick={() => setStatus(r, r.status === "APPROVED" ? "PENDING" : "APPROVED")}
                                disabled={busy}
                                title={r.status === "APPROVED" ? "Published: click to unpublish (back to pending)" : "Approve & publish"}
                                className={`${actionButton} ${r.status === "APPROVED" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                              >
                                <CircleCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setStatus(r, r.status === "HIDDEN" ? "APPROVED" : "HIDDEN")}
                                disabled={busy}
                                title={r.status === "HIDDEN" ? "Unhide (publish again)" : "Hide from customers"}
                                className={`${actionButton} bg-amber-50 text-amber-600 hover:bg-amber-100`}
                              >
                                {r.status === "HIDDEN" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => setHomepage(r, !r.showOnHomepage)}
                                disabled={busy || (!r.showOnHomepage && r.status !== "APPROVED")}
                                title={r.showOnHomepage ? "Remove from homepage" : r.status === "APPROVED" ? "Show on homepage" : "Approve the review first to show it on the homepage"}
                                className={`${actionButton} ${r.showOnHomepage ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-violet-50 text-violet-600 hover:bg-violet-100"}`}
                              >
                                <House className="h-4 w-4" />
                              </button>
                              <button onClick={() => setManaging(r)} disabled={busy} title="Manage associated products" className={`${actionButton} bg-indigo-50 text-indigo-600 hover:bg-indigo-100`}>
                                <Package className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleting(r)} disabled={busy} title="Delete review" className={`${actionButton} bg-rose-50 text-rose-600 hover:bg-rose-100`}>
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
        <Pager pagination={reviews.pagination} onPage={setPage} />
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} className="max-w-xl">
        {viewing && (
          <ReviewDetails
            key={`${viewing}-${detailsKey}`}
            id={viewing}
            canUpdate={canUpdate}
            onClose={() => setViewing(null)}
            onChanged={reviews.reload}
            onStatus={setStatus}
            onHomepage={setHomepage}
            onDelete={canDelete ? setDeleting : undefined}
            onManageProducts={canUpdate ? setManaging : undefined}
          />
        )}
      </Modal>

      <Modal open={!!managing} onClose={() => setManaging(null)} className="max-w-2xl">
        {managing && (
          <ManageProductsModal
            key={managing._id}
            review={managing}
            onClose={() => setManaging(null)}
            onSaved={() => {
              reviews.reload();
              setDetailsKey((k) => k + 1);
            }}
          />
        )}
      </Modal>

      <DeleteReviewDialog review={deleting} busy={!!deleting && busyId === deleting._id} onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} />
    </div>
  );
}

function ReviewDetails({
  id,
  canUpdate,
  onClose,
  onChanged,
  onStatus,
  onHomepage,
  onDelete,
  onManageProducts,
}: {
  id: string;
  canUpdate: boolean;
  onClose: () => void;
  onChanged: () => void;
  onStatus: (r: AdminReview, s: ReviewStatus) => Promise<void>;
  onHomepage: (r: AdminReview, on: boolean) => Promise<void>;
  onDelete?: (r: AdminReview) => void;
  onManageProducts?: (r: AdminReview) => void;
}) {
  const review = useApiQuery<AdminReview>(`/admin/reviews/${id}`);
  const r = review.data;
  const [working, setWorking] = useState(false);
  // Act, then refresh both this review and the list behind the modal
  const after = async (fn: () => Promise<void>) => {
    setWorking(true);
    await fn();
    await review.reload();
    onChanged();
    setWorking(false);
  };
  const card = "rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5";
  const cardLabel = "text-[11px] font-extrabold tracking-wider text-slate-400 uppercase";

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-7 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-slate-900">Review Details Audit</h2>
            <p className="truncate font-mono text-sm text-slate-500">ID: {id}</p>
          </div>
        </div>
        <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
          <X className="h-6 w-6" />
        </button>
      </div>

      {review.error ? (
        <ErrorBox message={review.error} onRetry={review.reload} />
      ) : !r ? (
        <Spinner label="Loading review..." />
      ) : (
        <div className="flex flex-col gap-5 overflow-y-auto px-7 py-6">
          <div className={card}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className={cardLabel}>Products ({1 + r.associatedProducts.length})</p>
              {onManageProducts && (
                <button onClick={() => onManageProducts(r)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                  <Package className="h-3.5 w-3.5" /> Manage
                </button>
              )}
            </div>
            <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
              <ProductRow
                title={r.productTitle}
                image={r.productImage}
                slug={r.product?.slug ?? r.productSlug}
                id={r.productId}
                tag="Purchased"
                note={r.product ? `Rating ${r.product.ratingAverage.toFixed(1)} ★ from ${r.product.ratingCount} published review${r.product.ratingCount === 1 ? "" : "s"}` : undefined}
              />
              {r.associatedProducts.map((p) => (
                <ProductRow key={p._id} title={p.productTitle} image={p.thumbnail} slug={p.slug} id={p._id} tag="Attached" inactive={p.status !== "ACTIVE"} />
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={card}>
              <p className={cardLabel}>Reviewer</p>
              <p className="mt-2 flex items-center gap-2 font-extrabold text-slate-900">
                <UserRound className="h-4 w-4 text-blue-600" /> {r.customerName}
              </p>
              <p className="mt-1 text-xs text-slate-500">{r.customerEmail || "-"}</p>
              <p className="mt-1 text-xs text-slate-500">
                Order{" "}
                <Link href={`${BASE}/orders/${r.orderId}`} className="font-mono font-bold text-blue-600 hover:underline">
                  {r.orderNumber}
                </Link>
              </p>
            </div>
            <div className={card}>
              <p className={cardLabel}>Rating &amp; verified</p>
              <p className="mt-2 flex items-center gap-2">
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-5 w-5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  ))}
                </span>
                <span className="font-extrabold text-slate-700">{r.rating}/5</span>
              </p>
              {/* Verified for the product actually bought; attached products show it as a non-verified review */}
              <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <BadgeCheck className="h-4 w-4" /> Verified Purchase: Yes ({r.productTitle})
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-extrabold text-slate-700">Review Comment:</p>
            <p className="rounded-3xl border border-slate-200/80 bg-slate-50/70 px-5 py-4 text-sm leading-relaxed whitespace-pre-line text-slate-800">
              {r.comment ? `"${r.comment}"` : <span className="text-slate-400">No written comment.</span>}
            </p>
          </div>

          <div className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={cardLabel}>Moderation</p>
              <div className="flex items-center gap-2">
                {r.showOnHomepage && <span className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-700">ON HOMEPAGE</span>}
                <ReviewStatusPill status={r.status} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Written {formatDate(r.createdAt)} ·{" "}
              {r.moderatedAt ? `Last moderated ${formatDate(r.moderatedAt)}${r.moderatedByName ? ` by ${r.moderatedByName}` : ""}` : "Not moderated yet"}
            </p>
            {canUpdate && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(["APPROVED", "HIDDEN", "REJECTED", "PENDING"] as ReviewStatus[])
                  .filter((s) => s !== r.status)
                  .map((s) => (
                    <button
                      key={s}
                      disabled={working}
                      onClick={() => after(() => onStatus(r, s))}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-50 ${STATUS_STYLE[s].tone} hover:brightness-95`}
                    >
                      {s === "APPROVED" ? "Approve & publish" : s === "HIDDEN" ? "Hide" : s === "REJECTED" ? "Reject" : "Move to pending"}
                    </button>
                  ))}
                <button
                  onClick={() => after(() => onHomepage(r, !r.showOnHomepage))}
                  disabled={working || (!r.showOnHomepage && r.status !== "APPROVED")}
                  title={!r.showOnHomepage && r.status !== "APPROVED" ? "Approve the review first" : undefined}
                  className="cursor-pointer rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {r.showOnHomepage ? "Remove from homepage" : "Show on homepage"}
                </button>
              </div>
            )}
          </div>

          {!!r.audit?.length && (
            <div className={card}>
              <p className={`${cardLabel} mb-3 flex items-center gap-1.5`}>
                <History className="h-3.5 w-3.5" /> Audit trail
              </p>
              <ol className="relative ml-2 space-y-4 border-l border-slate-200 pl-5">
                {r.audit.map((a, i) => (
                  <li key={`${a.action}-${a.at}-${i}`} className="relative">
                    <span className="absolute top-1 -left-[27px] h-3 w-3 rounded-full border-2 border-white bg-indigo-500 ring-1 ring-indigo-200" />
                    <p className="text-sm font-bold text-slate-800">{auditLabel(a)}</p>
                    <p className="text-xs text-slate-500">
                      {a.by ?? "System"} · {formatDateTime(a.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-7 py-5">
        {r && onDelete && (
          <button onClick={() => onDelete(r)} className="mr-auto h-11 cursor-pointer rounded-2xl px-5 text-sm font-bold text-rose-600 hover:bg-rose-50">
            Delete review
          </button>
        )}
        <button onClick={onClose} className="h-11 cursor-pointer rounded-2xl bg-slate-200/70 px-7 text-sm font-bold text-slate-800 hover:bg-slate-200">
          Close
        </button>
      </div>
    </div>
  );
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

const countOf = (v: Record<string, unknown> | null) => (Array.isArray(v?.associatedProductIds) ? v.associatedProductIds.length : 0);

/** Readable line for one audit entry. */
function auditLabel(a: ReviewAuditEntry) {
  switch (a.action) {
    case "REVIEW_CREATED":
      return `Review written${typeof a.newValue?.rating === "number" ? ` (${a.newValue.rating}★)` : ""}`;
    case "REVIEW_APPROVED":
      return "Approved & published";
    case "REVIEW_REJECTED":
      return "Rejected";
    case "REVIEW_HIDDEN":
      return "Hidden";
    case "REVIEW_PENDING":
      return "Moved back to pending";
    case "REVIEW_HOMEPAGE_ENABLED":
      return "Shown on homepage";
    case "REVIEW_HOMEPAGE_DISABLED":
      return "Removed from homepage";
    case "REVIEW_PRODUCTS_UPDATED":
      return `Attached products changed (${countOf(a.oldValue)} → ${countOf(a.newValue)})`;
    default:
      return a.action.replace(/^REVIEW_/, "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }
}

function ProductRow({ title, image, slug, id, tag, note, inactive }: { title: string; image: string; slug: string | null; id: string; tag: string; note?: string; inactive?: boolean }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image ? <img src={image} alt={title} className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-slate-300" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate font-extrabold text-slate-900">{title}</span>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${tag === "Purchased" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>{tag}</span>
          {inactive && <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-500 uppercase">Inactive</span>}
        </p>
        {slug && (
          <p className="font-mono text-xs text-slate-500">
            CODE: <span className="font-bold text-slate-700">{slug}</span>
          </p>
        )}
        <p className="mt-1 font-mono text-[11px] text-slate-400">• ID: {id}</p>
        {note && <p className="mt-1 text-[11px] text-slate-500">{note}</p>}
      </div>
      {slug && (
        <Link href={`/product/${slug}`} target="_blank" title="Open product page" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
    </li>
  );
}

const MAX_ATTACHED = 20;

/** Attach an approved review to other products too (PUT /admin/reviews/:id/products). */
function ManageProductsModal({ review, onClose, onSaved }: { review: AdminReview; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [selected, setSelected] = useState<ReviewProductRef[]>(review.associatedProducts);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const q = useDebounced(search);
  const catalog = useApiQuery<Product[]>(`/products${qs({ search: q, limit: 30 })}`);
  // The review's own product is always included, so it is not offered here
  const options = (catalog.data ?? []).filter((p) => p._id !== review.productId);
  const isSelected = (id: string) => selected.some((p) => p._id === id);

  const toggle = (p: Product) =>
    setSelected((list) =>
      list.some((x) => x._id === p._id)
        ? list.filter((x) => x._id !== p._id)
        : list.length >= MAX_ATTACHED
          ? list
          : [...list, { _id: p._id, productTitle: p.productTitle, slug: p.slug, thumbnail: p.thumbnail, status: p.status }]
    );

  const save = async () => {
    setSaving(true);
    const res = await action(`/admin/reviews/${review._id}/products`, { method: "PUT", json: { productIds: selected.map((p) => p._id) } });
    setSaving(false);
    if (res) {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-7 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50">
            <Package className="h-7 w-7 text-indigo-600" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-slate-900">Manage Associated Products</h2>
            <p className="truncate font-mono text-sm text-slate-500">Review ID: {review._id}</p>
          </div>
        </div>
        <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto px-7 py-6">
        <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 px-5 py-4">
          <p className="text-xs font-bold text-slate-500">
            {review.customerName} · {review.rating}★ · bought <span className="text-slate-800">{review.productTitle}</span>
          </p>
          {review.comment && <p className="mt-1 text-sm text-slate-600 italic">&ldquo;{review.comment}&rdquo;</p>}
          <p className="mt-2 text-[11px] text-slate-400">
            Attached products show this review too (marked as not a verified purchase for them). Only approved reviews are public.
          </p>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
            Selected products ({selected.length}/{MAX_ATTACHED})
          </p>
          {selected.length ? (
            <div className="flex flex-wrap gap-2">
              {selected.map((p) => (
                <span key={p._id} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-bold text-indigo-800">
                  {p.productTitle}
                  <span className="font-mono text-xs font-semibold text-indigo-500">({p.slug})</span>
                  <button onClick={() => setSelected((l) => l.filter((x) => x._id !== p._id))} className="cursor-pointer text-indigo-500 hover:text-indigo-800" aria-label={`Remove ${p.productTitle}`}>
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Only its own product ({review.productTitle}). Pick products below to show this review on them too.</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold text-slate-700">Search Catalog Products</p>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by product name or code..." />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Catalog selection ({options.length})</p>
          {catalog.loading && !catalog.data ? (
            <Spinner label="Loading products..." />
          ) : catalog.error ? (
            <ErrorBox message={catalog.error} onRetry={catalog.reload} />
          ) : !options.length ? (
            <p className="text-sm text-slate-400">No products found.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
              {options.map((p) => {
                const on = isSelected(p._id);
                const full = !on && selected.length >= MAX_ATTACHED;
                return (
                  <li key={p._id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                        on ? "border-indigo-400 bg-indigo-50/60" : "border-slate-200 bg-white hover:bg-slate-50"
                      } ${full ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(p)} className="h-5 w-5 accent-indigo-600" />
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.thumbnail ? <img src={p.thumbnail} alt={p.productTitle} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-slate-300" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-slate-900">{p.productTitle}</span>
                        <span className="block truncate font-mono text-xs text-slate-500">
                          {p.slug}
                          {p.categoryId?.name ? ` · ${p.categoryId.name}` : ""}
                        </span>
                      </span>
                      {on && <CircleCheck className="h-6 w-6 shrink-0 text-indigo-600" />}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-7 py-5">
        <button onClick={onClose} className="h-12 cursor-pointer rounded-2xl border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-2xl bg-indigo-600 px-7 text-sm font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Product Associations ({selected.length})
        </button>
      </div>
    </div>
  );
}

/** Delete confirmation in the style of the rest of the review screens. */
function DeleteReviewDialog({ review, busy, onCancel, onConfirm }: { review: AdminReview | null; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal open={!!review} onClose={busy ? () => {} : onCancel} className="max-w-lg" overlayClassName="bg-slate-900/50">
      {review && (
        <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-orange-300 text-5xl font-light text-orange-300">!</span>
          <h2 className="mt-6 text-3xl font-bold text-slate-700">Delete Review?</h2>
          <p className="mt-3 text-base text-slate-600">
            Are you sure you want to permanently delete {review.customerName}&apos;s {review.rating}-star review of <b>{review.productTitle}</b>?
          </p>
          {review.status === "APPROVED" && <p className="mt-1 text-xs text-slate-400">The product&apos;s rating will be recalculated.</p>}
          <div className="mt-7 flex gap-3">
            <button
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-lg bg-red-500 px-6 text-base font-bold text-white hover:bg-red-600 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Yes, Delete
            </button>
            <button onClick={onCancel} disabled={busy} className="h-12 cursor-pointer rounded-lg bg-slate-500 px-6 text-base font-bold text-white hover:bg-slate-600 disabled:opacity-60">
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
