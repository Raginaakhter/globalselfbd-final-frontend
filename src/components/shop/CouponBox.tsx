"use client";

import React, { useState } from "react";
import { Loader2, TicketPercent, X } from "lucide-react";
import { formatPrice } from "@/lib/shop";

export type AppliedCoupon = { code: string; discount: number; description?: string };

type Props = {
  applied: AppliedCoupon | null;
  /** Checks the code with the backend; resolves with an error message, or null when it worked. */
  onApply: (code: string) => Promise<string | null>;
  onRemove: () => void;
  disabled?: boolean;
};

/** Optional coupon field for checkout. */
export default function CouponBox({ applied, onApply, onRemove, disabled }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const apply = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return setError("Enter a coupon code.");
    setChecking(true);
    const message = await onApply(clean);
    setChecking(false);
    setError(message ?? "");
    if (!message) setCode("");
  };

  if (applied) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-3">
        <TicketPercent className="w-5 h-5 shrink-0 text-brand-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-navy-700">{applied.code}</p>
          <p className="text-xs text-brand-700 font-semibold">You save {formatPrice(applied.discount)}</p>
        </div>
        <button type="button" onClick={onRemove} disabled={disabled} className="p-1.5 rounded-full text-slate-500 hover:bg-white hover:text-rose-600 cursor-pointer" aria-label="Remove coupon">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">
        Coupon code <span className="text-slate-400 normal-case font-medium">(optional)</span>
      </label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={(e) => {
            // Enter applies the coupon instead of placing the order
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
          maxLength={30}
          placeholder="e.g. EID10"
          className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl border bg-white text-sm font-bold tracking-wider uppercase outline-none placeholder:font-medium placeholder:tracking-normal placeholder:normal-case placeholder:text-slate-400 focus:ring-4 ${
            error ? "border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-brand-600 focus:ring-brand-600/15"
          }`}
        />
        <button
          type="button"
          onClick={apply}
          disabled={checking || disabled}
          className="px-5 rounded-xl text-sm font-bold text-white bg-navy-700 hover:bg-navy-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          {checking && <Loader2 className="w-4 h-4 animate-spin" />} Apply
        </button>
      </div>
      {error && <p className="text-xs text-rose-600 font-medium mt-1.5">{error}</p>}
    </div>
  );
}
