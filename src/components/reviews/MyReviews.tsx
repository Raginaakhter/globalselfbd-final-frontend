"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { ApiError, useAuth } from "@/context/AuthContext";
import type { MyReview, ReviewStatus } from "@/lib/backend-types";
import Stars from "./Stars";

const STATUS: Record<ReviewStatus, { label: string; tone: string }> = {
  PENDING: { label: "Waiting for approval", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Published", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Not approved", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  HIDDEN: { label: "Hidden", tone: "bg-slate-100 text-slate-600 border-slate-200" },
};

/** The signed-in customer's reviews, in every status (GET /reviews/my). */
export default function MyReviews() {
  const { api } = useAuth();
  const [reviews, setReviews] = useState<MyReview[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<MyReview[]>("/reviews/my")
      .then((res) => setReviews(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your reviews."));
  }, [api]);

  return (
    <div className="auth-card rounded-3xl p-6 sm:p-8 shadow-xl">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
        <MessageSquareText className="w-5 h-5 text-cyan-600" />
        <span>My Reviews</span>
      </h2>
      {error ? (
        <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</p>
      ) : !reviews ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !reviews.length ? (
        <p className="text-sm text-slate-500 text-center py-8">You haven&apos;t written any reviews yet. You can review a product from its page after your order is delivered.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r._id} className="p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{r.productTitle}</p>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS[r.status].tone}`}>{STATUS[r.status].label}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Stars value={r.rating} size="w-3.5 h-3.5" />
                <span className="text-xs text-slate-400">Order {r.orderNumber}</span>
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
