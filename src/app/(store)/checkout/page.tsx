"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CreditCard, Loader2, Lock, MapPin, Smartphone, Store, Truck, User } from "lucide-react";
import { toast } from "sonner";
import { ApiError, useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/shop";
import { useSite } from "@/context/SiteContext";
import type { AdminDiscountType, CheckoutPreview, FulfillmentMethod, Order } from "@/lib/backend-types";
import OrderSummary from "@/components/shop/OrderSummary";
import CouponBox, { type AppliedCoupon } from "@/components/shop/CouponBox";
import { PreOrderNotice } from "@/components/orders/StatusTimeline";

type Zone = "dhaka" | "outside";
type Form = { name: string; phone: string; email: string; address: string; city: string; area: string; note: string };
type Errors = Partial<Record<keyof Form, string>>;

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: Form, zone: Zone, emailRequired: boolean): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!BD_PHONE.test(f.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid Bangladeshi mobile number (e.g. 01712345678).";
  // Guests must provide an email — order confirmation and status updates go there.
  // Signed-in users already have an email on file; we fall back to that server-side.
  if (!f.email.trim()) {
    if (emailRequired) e.email = "Email is required so we can send you order updates.";
  } else if (!EMAIL.test(f.email)) {
    e.email = "Enter a valid email address.";
  }
  if (f.address.trim().length < 5) e.address = "Please enter your full delivery address.";
  if (zone === "outside" && f.city.trim().length < 2) e.city = "Please enter your city / district.";
  if (f.area.trim().length < 2) e.area = "Please enter your area.";
  return e;
}

const inputCls = (err?: string) =>
  `w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
    err ? "border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-brand-600 focus:ring-brand-600/15"
  }`;

function Field({ label, error, children, optional }: { label: string; error?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">
        {label} {optional && <span className="text-slate-400 normal-case font-medium">(optional)</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-rose-600 font-medium mt-1.5">{error}</span>}
    </label>
  );
}

const Skeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
    <div className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse" />
  </div>
);

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, api } = useAuth();
  const cart = useCart();

  const [zone, setZone] = useState<Zone>("dhaka");
  const [edits, setEdits] = useState<Partial<Form>>({});
  const form: Form = { name: user?.name ?? "", phone: "", email: user?.email ?? "", address: "", city: "", area: "", note: "", ...edits };
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);
  const { settings } = useSite();
  // Coupon checked by the backend for this cart subtotal
  const [coupon, setCoupon] = useState<(AppliedCoupon & { subtotal: number }) | null>(null);
  const discount = coupon?.discount ?? 0;

  // Fulfillment + admin discount — admin fields are gated on canUseAdminDiscount from the preview response.
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("DELIVERY");
  const [adminDiscountType, setAdminDiscountType] = useState<AdminDiscountType>("PERCENTAGE");
  const [adminDiscountValue, setAdminDiscountValue] = useState<string>("");
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const canUseAdminDiscount = preview?.canUseAdminDiscount ?? false;

  const parsedAdminValue = useMemo(() => {
    if (!canUseAdminDiscount) return 0;
    const n = Number(adminDiscountValue);
    if (!Number.isFinite(n) || n < 0) return 0;
    if (adminDiscountType === "PERCENTAGE") return Math.min(100, n);
    return n;
  }, [canUseAdminDiscount, adminDiscountValue, adminDiscountType]);

  // Live preview from the backend. Debounced so each keystroke doesn't fire a request.
  const previewKey = `${cart.subtotal}|${coupon?.code ?? ""}|${fulfillmentMethod}|${zone}|${form.city.trim()}|${form.area.trim()}|${form.address.trim()}|${adminDiscountType}|${parsedAdminValue}`;
  useEffect(() => {
    if (!isAuthenticated || cart.lines.length === 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      const body = {
        customerName: form.name.trim() || user?.name || "",
        phoneNumber: form.phone.replace(/[\s-]/g, "") || "01700000000",
        email: form.email.trim() || undefined,
        shippingAddress: form.address.trim() || "pending",
        city: zone === "dhaka" ? "Dhaka" : (form.city.trim() || "Dhaka"),
        area: form.area.trim() || "pending",
        paymentMethod: "CASH_ON_DELIVERY" as const,
        fulfillmentMethod,
        couponCode: coupon?.code,
        ...(canUseAdminDiscount && parsedAdminValue > 0
          ? { adminDiscountType, adminDiscountValue: parsedAdminValue }
          : {}),
      };
      api<CheckoutPreview>("/orders/checkout", { method: "POST", body: JSON.stringify(body) })
        .then((res) => {
          if (cancelled) return;
          setPreview(res.data);
          setPreviewError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          setPreview(null);
          setPreviewError(err instanceof ApiError ? err.message : "Could not calculate checkout totals.");
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, isAuthenticated]);

  const checkCoupon = async (code: string): Promise<string | null> => {
    try {
      const res = await api<{ code: string; discount: number; description: string }>("/coupons/apply", { method: "POST", body: JSON.stringify({ code }) });
      setCoupon({ code: res.data.code, discount: res.data.discount, description: res.data.description, subtotal: cart.subtotal });
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "Could not check the coupon. Please try again.";
    }
  };

  // The cart changed after the coupon was applied: check it again for the new items
  const couponCode = coupon?.code;
  const couponStale = coupon !== null && coupon.subtotal !== cart.subtotal;
  useEffect(() => {
    if (!couponStale || !couponCode) return;
    const id = setTimeout(() => {
      void checkCoupon(couponCode).then((message) => {
        if (message) {
          setCoupon(null);
          toast.error(`Coupon removed: ${message}`);
        }
      });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponStale, couponCode, cart.subtotal]);

  if (authLoading || !cart.hydrated) return <Skeleton />;

  if (cart.lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-14 text-center">
        <div className="w-28 h-28 mx-auto rounded-full bg-brand-50 flex items-center justify-center text-6xl mb-5">🛍️</div>
        <h1 className="text-2xl font-black text-navy-700">Nothing to check out yet</h1>
        <p className="text-slate-500 mt-2 mb-6">Add a few products to your cart first.</p>
        <Link href="/shop" className="inline-block px-7 py-3.5 rounded-full text-sm font-bold text-white btn-primary-gradient">
          Browse Products
        </Link>
      </div>
    );
  }

  // Prefer the backend-calculated shipping. Fall back to the local-rate estimate while the first preview is in flight.
  const rate = zone === "dhaka" ? settings.shippingInsideDhaka : settings.shippingOutsideDhaka;
  const shipping = preview ? preview.shippingCost : fulfillmentMethod === "STORE_PICKUP" ? 0 : rate;
  const adminDiscountAmount = preview?.adminDiscount?.amount ?? 0;
  const totalAmount = preview?.totalAmount ?? Math.max(0, cart.subtotal - discount - adminDiscountAmount + shipping);
  const available = cart.lines.filter((l) => l.isAvailable);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setEdits((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.hasIssues) {
      toast.error("Remove the unavailable items from your cart first.");
      return;
    }
    const found = validate(form, zone, !isAuthenticated);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setPlacing(true);
    const payload = {
      customerName: form.name.trim(),
      phoneNumber: form.phone.replace(/[\s-]/g, ""),
      email: form.email.trim() || undefined,
      shippingAddress: form.address.trim(),
      city: zone === "dhaka" ? "Dhaka" : form.city.trim(),
      area: form.area.trim(),
      orderNotes: form.note.trim() || undefined,
      paymentMethod: "CASH_ON_DELIVERY" as const,
      fulfillmentMethod,
      couponCode: coupon?.code,
      // Admin fields only — backend returns 403 if a non-admin sends them.
      ...(canUseAdminDiscount && parsedAdminValue > 0
        ? { adminDiscountType, adminDiscountValue: parsedAdminValue }
        : {}),
    };

    try {
      if (isAuthenticated) {
        // Signed-in: cart lives on the backend, order endpoint pulls from it.
        const res = await api<Order>("/orders", { method: "POST", body: JSON.stringify(payload) });
        await cart.refresh();
        toast.success(res.message || "Order placed successfully!");
        router.replace(`/order-success/${res.data._id}`);
        return;
      }

      // Guest: send cart items inline. Call /orders/guest without the Bearer header.
      const items = cart.lines
        .filter((l) => l.isAvailable)
        .map((l) =>
          l.type === "combo" && l.comboId
            ? { comboId: l.comboId, quantity: l.quantity }
            : { productId: l.productId, quantity: l.quantity, size: l.size ?? undefined }
        );
      const guestRes = await fetch("/api/v1/orders/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, items }),
      });
      const guestBody = (await guestRes.json().catch(() => null)) as { success?: boolean; message?: string; data?: Order } | null;
      if (!guestRes.ok || !guestBody?.success || !guestBody.data) {
        throw new ApiError(guestBody?.message || `Request failed (${guestRes.status})`, guestRes.status);
      }
      await cart.clear();
      toast.success(guestBody.message || "Order placed successfully!");
      const phone = form.phone.replace(/[\s-]/g, "");
      const num = guestBody.data.orderNumber;
      // Guests cannot open /order-success (that reads /orders/:id, which needs auth).
      // Send them to the public track-order page prefilled with their order details instead.
      router.replace(`/track-order?orderNumber=${encodeURIComponent(num)}&phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to place order. Please try again.");
      if (err instanceof ApiError && err.status === 409) await cart.refresh();
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-navy-700 tracking-tight">Checkout</h1>
        <Link href="/cart" className="text-sm font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to cart
        </Link>
      </div>

      <form onSubmit={placeOrder} noValidate className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-lg font-black text-navy-700 mb-5">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </span>
              Contact details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" error={errors.name}>
                <input value={form.name} maxLength={100} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="Your full name" className={inputCls(errors.name)} />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className={inputCls(errors.phone)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email" error={errors.email} optional={isAuthenticated}>
                  <input
                    type="email"
                    required={!isAuthenticated}
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    autoComplete="email"
                    placeholder="name@example.com"
                    className={inputCls(errors.email)}
                  />
                  {!isAuthenticated && (
                    <span className="mt-1.5 block text-[11px] text-slate-500">
                      We will email your order confirmation and delivery updates to this address.
                    </span>
                  )}
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-lg font-black text-navy-700 mb-5">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </span>
              Fulfillment method
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(
                [
                  { v: "DELIVERY", icon: Truck, t: "Delivery", s: "We bring it to your address" },
                  { v: "STORE_PICKUP", icon: Store, t: "Buy from Store", s: "No delivery charge · Pick up in store" },
                ] as const
              ).map(({ v, icon: Icon, t, s }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFulfillmentMethod(v)}
                  aria-pressed={fulfillmentMethod === v}
                  className={`text-left rounded-2xl border-2 p-4 transition-all cursor-pointer flex items-start gap-3 ${
                    fulfillmentMethod === v ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-brand-300"
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${fulfillmentMethod === v ? "text-brand-700" : "text-slate-500"}`} />
                  <div>
                    <span className="block text-sm font-black text-navy-700">{t}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{s}</span>
                  </div>
                </button>
              ))}
            </div>

            <h2 className="flex items-center gap-2.5 text-lg font-black text-navy-700 mb-5">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </span>
              {fulfillmentMethod === "STORE_PICKUP" ? "Contact address" : "Delivery address"}
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(
                [
                  { v: "dhaka", t: "Inside Dhaka", s: `${formatPrice(settings.shippingInsideDhaka)} · 1–3 days` },
                  { v: "outside", t: "Outside Dhaka", s: `${formatPrice(settings.shippingOutsideDhaka)} · 3–5 days` },
                ] as const
              ).map((z) => (
                <button
                  key={z.v}
                  type="button"
                  onClick={() => setZone(z.v)}
                  aria-pressed={zone === z.v}
                  disabled={fulfillmentMethod === "STORE_PICKUP"}
                  className={`text-left rounded-2xl border-2 p-4 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${zone === z.v ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-brand-300"}`}
                >
                  <span className="block text-sm font-black text-navy-700">{z.t}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{z.s}</span>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Full address" error={errors.address}>
                  <textarea rows={3} maxLength={300} value={form.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" placeholder="House, road, block, landmark…" className={inputCls(errors.address)} />
                </Field>
              </div>
              {zone === "outside" && (
                <Field label="City / District" error={errors.city}>
                  <input value={form.city} maxLength={60} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Chattogram" className={inputCls(errors.city)} />
                </Field>
              )}
              <Field label="Area" error={errors.area}>
                <input value={form.area} maxLength={60} onChange={(e) => set("area", e.target.value)} placeholder={zone === "dhaka" ? "e.g. Dhanmondi" : "e.g. Agrabad"} className={inputCls(errors.area)} />
              </Field>
              <div className={zone === "outside" ? "sm:col-span-2" : ""}>
                <Field label="Order note" optional>
                  <input value={form.note} maxLength={500} onChange={(e) => set("note", e.target.value)} placeholder="Delivery instructions" className={inputCls()} />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-lg font-black text-navy-700 mb-5">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </span>
              Payment method
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-2xl border-2 border-brand-600 bg-brand-50 p-4">
                <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl">💵</span>
                <div className="flex-1">
                  <p className="text-sm font-black text-navy-700">Cash on Delivery</p>
                  <p className="text-xs text-slate-500">Pay when your order arrives · ডেলিভারির সময় টাকা দিন</p>
                </div>
                <span className="w-5 h-5 rounded-full border-[5px] border-brand-600 bg-white" aria-label="Selected" />
              </div>
              {[
                { icon: Smartphone, t: "bKash / Nagad" },
                { icon: CreditCard, t: "Credit / Debit Card" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 opacity-60" aria-disabled="true">
                  <span className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-500" />
                  </span>
                  <p className="flex-1 text-sm font-bold text-slate-600">{t}</p>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Coming soon</span>
                </div>
              ))}
            </div>
          </section>

          {canUseAdminDiscount && (
            <section className="rounded-3xl bg-white border-2 border-dashed border-indigo-300 shadow-sm p-5 sm:p-7">
              <h2 className="flex items-center gap-2.5 text-lg font-black text-indigo-700 mb-1">
                Admin discount
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">Staff only</span>
              </h2>
              <p className="text-xs text-slate-500 mb-5">Applied after the coupon discount. The backend recomputes and enforces the limits.</p>
              <div className="grid sm:grid-cols-[180px_1fr] gap-4">
                <Field label="Discount type">
                  <select
                    value={adminDiscountType}
                    onChange={(e) => setAdminDiscountType(e.target.value as AdminDiscountType)}
                    className={inputCls()}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (৳)</option>
                  </select>
                </Field>
                <Field label={adminDiscountType === "PERCENTAGE" ? "Percent (0-100)" : "Taka amount"}>
                  <input
                    type="number"
                    min={0}
                    max={adminDiscountType === "PERCENTAGE" ? 100 : undefined}
                    step={adminDiscountType === "PERCENTAGE" ? 0.1 : 1}
                    value={adminDiscountValue}
                    onChange={(e) => setAdminDiscountValue(e.target.value)}
                    placeholder={adminDiscountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"}
                    className={inputCls()}
                  />
                </Field>
              </div>
              {adminDiscountAmount > 0 && (
                <p className="mt-3 text-sm font-bold text-indigo-700">
                  Discount applied: − {formatPrice(adminDiscountAmount)}
                </p>
              )}
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-40">
          <OrderSummary
            lines={available.map((l) => ({ key: l.key, title: l.title, thumbnail: l.thumbnail, quantity: l.quantity, subtotal: l.subtotal, size: l.size, slug: l.slug }))}
            subtotal={cart.subtotal}
            shipping={shipping}
            discount={discount}
            adminDiscount={adminDiscountAmount}
            fulfillmentLabel={fulfillmentMethod === "STORE_PICKUP" ? "Store Pickup" : undefined}
            total={totalAmount}
          >
            <CouponBox applied={coupon} onApply={checkCoupon} onRemove={() => setCoupon(null)} disabled={placing} />
            {preview?.isPreOrder && <PreOrderNotice minDays={preview.preOrderMinDays} expectedDeliveryDate={preview.expectedDeliveryDate} className="mt-4" />}
            {previewError && <p className="mt-3 text-xs font-semibold text-rose-600">{previewError}</p>}
            <button
              type="submit"
              disabled={placing || cart.loading || couponStale}
              className="mt-5 w-full py-4 rounded-full text-sm font-black text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {placing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Placing your order…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Place Order — {formatPrice(totalAmount)}
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-3">Final totals are confirmed by our server when the order is placed.</p>
          </OrderSummary>
        </div>
      </form>
    </div>
  );
}
