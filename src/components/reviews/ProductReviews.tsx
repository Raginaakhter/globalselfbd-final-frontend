"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BadgeCheck, Loader2, MessageSquareText, Star } from "lucide-react";
import { ApiError, useAuth } from "@/context/AuthContext";
import type { ProductReviewSummary, PublicReview, ReviewEligibility } from "@/lib/backend-types";
import Stars from "./Stars";

const PAGE_SIZE = 5;
const formatDate = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Approved reviews of a product, the star breakdown, and the form for customers who received it. */
export default function ProductReviews({ productId, slug }: { productId: string; slug: string }) {
  const { api, user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummary | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await api<PublicReview[]>(`/products/${encodeURIComponent(slug)}/reviews?page=${p}&limit=${PAGE_SIZE}`);
        setReviews((list) => (p === 1 ? res.data : [...list, ...res.data]));
        setSummary((res as unknown as { summary: ProductReviewSummary }).summary ?? null);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setPage(p);
      } catch {
        // Reviews are optional on the page; leave the section empty on failure
      } finally {
        setLoading(false);
      }
    },
    [api, slug]
  );

  useEffect(() => {
    queueMicrotask(() => void load(1));
  }, [load]);

  useEffect(() => {
    if (authLoading || !user) return;
    api<ReviewEligibility>(`/reviews/eligibility?productId=${encodeURIComponent(productId)}`)
      .then((res) => setEligibility(res.data))
      .catch(() => setEligibility(null));
  }, [api, authLoading, user, productId]);

  const total = summary?.totalReviews ?? 0;

  return (
    <section id="reviews" className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 mt-6 scroll-mt-24">
      <h2 className="text-lg font-black text-navy-700 mb-5 flex items-center gap-2">
        <MessageSquareText className="w-5 h-5 text-brand-700" /> Customer reviews
      </h2>

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-navy-700">{total ? summary!.averageRating.toFixed(1) : "0.0"}</span>
            <span className="text-sm text-slate-500 mb-1.5">out of 5</span>
          </div>
          <Stars value={summary?.averageRating ?? 0} size="w-5 h-5" className="mt-1" />
          <p className="text-xs text-slate-500 mt-1">
            {total} review{total === 1 ? "" : "s"}
          </p>
          <ul className="mt-4 space-y-1.5">
            {(["5", "4", "3", "2", "1"] as const).map((n) => {
              const count = summary?.breakdown[n] ?? 0;
              return (
                <li key={n} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-3 font-bold">{n}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: total ? `${(count / total) * 100}%` : 0 }} />
                  </span>
                  <span className="w-6 text-right">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-w-0">
          <ReviewPrompt productId={productId} signedIn={!!user} authLoading={authLoading} eligibility={eligibility} onSubmitted={() => setEligibility((e) => (e ? { ...e, eligible: false, alreadyReviewed: true } : e))} />

          {loading && !reviews.length ? (
            <div className="space-y-3 mt-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : !reviews.length ? (
            <p className="text-sm text-slate-500 mt-4">No reviews yet. Customers who bought this product can share their experience here.</p>
          ) : (
            <ul className="divide-y divide-slate-100 mt-2">
              {reviews.map((r) => (
                <li key={r._id} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-bold text-navy-700">{r.customerName}</span>
                    {r.verifiedPurchase ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified purchase
                      </span>
                    ) : (
                      r.reviewedProduct && (
                        // An admin attached this review from a related product
                        <span className="text-[11px] font-semibold text-slate-400">Review of {r.reviewedProduct}</span>
                      )
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{formatDate(r.createdAt)}</span>
                  </div>
                  <Stars value={r.rating} size="w-3.5 h-3.5" className="mt-1" />
                  {r.comment && <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-line">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
          {page < totalPages && (
            <button
              type="button"
              onClick={() => load(page + 1)}
              disabled={loading}
              className="mt-2 px-5 py-2 rounded-full border border-slate-200 text-sm font-bold text-navy-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Show more reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewPrompt({
  productId,
  signedIn,
  authLoading,
  eligibility,
  onSubmitted,
}: {
  productId: string;
  signedIn: boolean;
  authLoading: boolean;
  eligibility: ReviewEligibility | null;
  onSubmitted: () => void;
}) {
  if (authLoading) return null;
  const box = "rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600";
  if (!signedIn) {
    return (
      <p className={box}>
        <Link href="/login" className="font-bold text-brand-700 hover:underline">
          Sign in
        </Link>{" "}
        to review this product after it is delivered.
      </p>
    );
  }
  if (!eligibility) return null;
  if (eligibility.eligible) return <ReviewForm productId={productId} orders={eligibility.orders} onSubmitted={onSubmitted} />;
  return (
    <p className={box}>
      {eligibility.alreadyReviewed ? "Thanks! You have already reviewed this product." : "You can review this product once an order with it has been delivered."}
    </p>
  );
}

function ReviewForm({ productId, orders, onSubmitted }: { productId: string; orders: ReviewEligibility["orders"]; onSubmitted: () => void }) {
  const { api } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [orderId, setOrderId] = useState(orders[0]?.orderId ?? "");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return toast.error("Please choose a star rating.");
    setSending(true);
    try {
      const res = await api("/reviews", { method: "POST", body: JSON.stringify({ orderId, productId, rating, comment: comment.trim() || undefined }) });
      setDone(res.message || "Thank you! Your review will appear after approval.");
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit your review.");
    } finally {
      setSending(false);
    }
  };

  if (done) return <p className="rounded-2xl bg-brand-50 border border-brand-100 p-4 text-sm font-semibold text-brand-800">{done}</p>;

  return (
    <form onSubmit={submit} className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-3">
      <p className="text-sm font-bold text-navy-700">Write a review</p>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`} className="cursor-pointer p-0.5">
            <Star className={`w-7 h-7 transition ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-xs font-semibold text-slate-500">{rating} / 5</span>}
      </div>
      {orders.length > 1 && (
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm">
          {orders.map((o) => (
            <option key={o.orderId} value={o.orderId}>
              Order {o.orderNumber}
            </option>
          ))}
        </select>
      )}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="How was the product? (optional)"
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400">Reviews are published after approval.</span>
        <button type="submit" disabled={sending} className="px-5 py-2.5 rounded-full text-sm font-bold text-white btn-primary-gradient flex items-center gap-2 cursor-pointer disabled:opacity-60">
          {sending && <Loader2 className="w-4 h-4 animate-spin" />} Submit review
        </button>
      </div>
    </form>
  );
}
