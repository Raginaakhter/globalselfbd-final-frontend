"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Product, ProductOptions } from "@/lib/backend-types";
import { BASE } from "../AppSidebar";
import { useApiAction, useApiQuery } from "../api";
import { ErrorBox, FieldError, PrimaryButton, Spinner, Toggle, inputClass, labelClass } from "../ui";
import { ProductImages } from "./ProductMedia";

type Options = ProductOptions & { statuses?: string[] };

interface FormState {
  productTitle: string;
  slug: string;
  productDescription: string;
  categoryId: string;
  stock: string;
  productCost: string;
  customerSellPrice: string;
  customerSpecialPrice: string;
  isFabric: boolean;
  sizes: string[];
  unit: string;
  quantity: string;
  thumbnail: string;
  gallery: string[];
  status: "ACTIVE" | "INACTIVE";
}

const toForm = (p?: Product | null): FormState => ({
  productTitle: p?.productTitle ?? "",
  slug: p?.slug ?? "",
  productDescription: p?.productDescription ?? "",
  categoryId: p?.categoryId?._id ?? "",
  stock: p?.stock != null ? String(p.stock) : "",
  productCost: p?.productCost != null ? String(p.productCost) : "",
  customerSellPrice: p ? String(p.customerSellPrice) : "",
  customerSpecialPrice: p?.customerSpecialPrice != null ? String(p.customerSpecialPrice) : "",
  isFabric: p?.isFabric ?? false,
  sizes: p?.sizes ?? [],
  unit: p?.unit ?? "",
  quantity: p?.quantity != null ? String(p.quantity) : "",
  thumbnail: p?.thumbnail ?? "",
  gallery: p?.gallery ?? [],
  status: p?.status ?? "ACTIVE",
});

export default function ProductForm({ productId }: { productId?: string }) {
  const options = useApiQuery<Options>("/products/options");
  const product = useApiQuery<Product>(productId ? `/products/${encodeURIComponent(productId)}` : null);

  if (options.error || product.error) return <ErrorBox message={(options.error || product.error)!} onRetry={options.error ? options.reload : product.reload} />;
  if (!options.data || (productId && !product.data)) return <Spinner label="Loading product form..." />;

  return <ProductFormInner key={product.data?._id ?? "new"} product={product.data} options={options.data} />;
}

function ProductFormInner({ product, options }: { product: Product | null; options: Options }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const action = useApiAction();
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  const canEditStock = product ? hasPermission("inventory.update") : true;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const text = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(k, e.target.value as never);

  // The current category may be inactive, in which case the options list leaves it out.
  const categories =
    product?.categoryId && !options.categories.some((c) => c._id === product.categoryId!._id)
      ? [...options.categories, { _id: product.categoryId._id, name: product.categoryId.name, slug: product.categoryId.slug, path: `${product.categoryId.name} (inactive)` }]
      : options.categories;

  const validate = () => {
    const e: typeof errors = {};
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    if (!form.productTitle.trim()) e.productTitle = "Title is required";
    if (!form.categoryId) e.categoryId = "Choose a category";
    const sell = num(form.customerSellPrice);
    if (sell == null || !(sell >= 0)) e.customerSellPrice = "Enter a valid price";
    const special = num(form.customerSpecialPrice);
    if (special != null && (!(special >= 0) || (sell != null && special > sell))) e.customerSpecialPrice = "Special price must be between 0 and the sell price";
    if (canEditStock) {
      const stock = num(form.stock);
      if (stock == null || !Number.isInteger(stock) || stock < 0) e.stock = "Stock must be a whole number (0 or more)";
    }
    if (!!form.unit !== !!form.quantity.trim()) e.quantity = "Unit and quantity go together";
    if (form.isFabric && !form.sizes.length && !(form.unit && form.quantity)) e.sizes = "Fabric products need sizes or a unit + quantity";
    if (!form.thumbnail) e.thumbnail = "Upload a thumbnail";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const body: Record<string, unknown> = {
      productTitle: form.productTitle.trim(),
      productDescription: form.productDescription,
      categoryId: form.categoryId,
      customerSellPrice: Number(form.customerSellPrice),
      customerSpecialPrice: form.customerSpecialPrice.trim() ? Number(form.customerSpecialPrice) : null,
      isFabric: form.isFabric,
      sizes: form.isFabric ? form.sizes : [],
      unit: form.unit || null,
      quantity: form.quantity.trim() ? Number(form.quantity) : null,
      thumbnail: form.thumbnail,
      gallery: form.gallery,
      status: form.status,
    };
    if (form.slug.trim()) body.slug = form.slug.trim();
    if (form.productCost.trim()) body.productCost = Number(form.productCost);
    if (canEditStock) body.stock = Number(form.stock);

    setSaving(true);
    const res = product
      ? await action(`/products/${product._id}`, { method: "PUT", json: body }, "Product updated")
      : await action("/products", { method: "POST", json: body }, "Product created");
    setSaving(false);
    if (res) router.push(`${BASE}/products`);
  };

  const card = "flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs";
  const field = (label: string, key: keyof FormState, input: React.ReactNode) => (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {input}
      <FieldError message={errors[key]} />
    </label>
  );

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`${BASE}/products`} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{product ? "Edit Product" : "Add Product"}</h1>
        </div>
        <PrimaryButton type="submit" loading={saving}>
          {product ? "Save Changes" : "Create Product"}
        </PrimaryButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className={card}>
            <h2 className="text-sm font-extrabold text-slate-900">Basic information</h2>
            {field("Product title *", "productTitle", <input className={inputClass} value={form.productTitle} onChange={text("productTitle")} />)}
            {field("Slug", "slug", <input className={inputClass} value={form.slug} onChange={text("slug")} placeholder="Auto-generated from the title" />)}
            {field(
              "Description",
              "productDescription",
              <textarea className={inputClass} rows={5} value={form.productDescription} onChange={text("productDescription")} />
            )}
            {field(
              "Category *",
              "categoryId",
              <select className={inputClass} value={form.categoryId} onChange={text("categoryId")}>
                <option value="">— Select a category —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.path}
                  </option>
                ))}
              </select>
            )}
            {!categories.length && <p className="text-xs text-amber-600">No active categories yet. Create a category first.</p>}
          </section>

          <section className={card}>
            <h2 className="text-sm font-extrabold text-slate-900">Pricing & stock</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Sell price (৳) *", "customerSellPrice", <input type="number" min={0} step="0.01" className={inputClass} value={form.customerSellPrice} onChange={text("customerSellPrice")} />)}
              {field("Special price (৳)", "customerSpecialPrice", <input type="number" min={0} step="0.01" className={inputClass} value={form.customerSpecialPrice} onChange={text("customerSpecialPrice")} />)}
              {field("Product cost (৳)", "productCost", <input type="number" min={0} step="0.01" className={inputClass} value={form.productCost} onChange={text("productCost")} />)}
              {field(
                canEditStock ? "Stock *" : "Stock (needs inventory permission)",
                "stock",
                <input type="number" min={0} step={1} className={inputClass} value={form.stock} onChange={text("stock")} disabled={!canEditStock} />
              )}
            </div>
          </section>

          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">Variants</h2>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                Fabric product <Toggle checked={form.isFabric} onChange={(v) => set("isFabric", v)} />
              </label>
            </div>
            {form.isFabric && (
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Sizes</span>
                <div className="flex flex-wrap gap-2">
                  {options.sizes.map((s) => {
                    const on = form.sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("sizes", on ? form.sizes.filter((x) => x !== s) : [...form.sizes, s])}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold ${on ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <FieldError message={errors.sizes} />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {field(
                "Unit",
                "unit",
                <select className={inputClass} value={form.unit} onChange={text("unit")}>
                  <option value="">— None —</option>
                  {options.units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              )}
              {field("Quantity per unit", "quantity", <input type="number" min={0} step="any" className={inputClass} value={form.quantity} onChange={text("quantity")} />)}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="text-sm font-extrabold text-slate-900">Status</h2>
            <select className={inputClass} value={form.status} onChange={text("status")}>
              <option value="ACTIVE">Active (visible in the store)</option>
              <option value="INACTIVE">Inactive (hidden)</option>
            </select>
          </section>
          <section className={card}>
            <h2 className="text-sm font-extrabold text-slate-900">Images</h2>
            <ProductImages thumbnail={form.thumbnail} gallery={form.gallery} onChange={({ thumbnail, gallery }) => setForm((f) => ({ ...f, thumbnail, gallery }))} />
            <FieldError message={errors.thumbnail} />
          </section>
        </div>
      </div>
    </form>
  );
}
