"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CirclePlus, Eye, Package, Pencil, Tag, Trash } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Category, Product, ProductDeleteResult, Status } from "@/lib/backend-types";
import { BASE } from "../AppSidebar";
import { errorMessage, qs, useApiAction, useApiQuery } from "../api";
import { formatBDT } from "../format";
import {
  EmptyState,
  ErrorBox,
  Modal,
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
} from "../ui";

export function ProductThumb({ src, alt, className = "h-12 w-12" }: { src?: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Package className="h-5 w-5 text-slate-300" />
      )}
    </div>
  );
}

export default function ProductsCatalog() {
  const { api, hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [stockFor, setStockFor] = useState<Product | null>(null);
  const q = useDebounced(search);

  const canCreate = hasPermission("products.create");
  const canUpdate = hasPermission("products.update");
  const canDelete = hasPermission("products.delete");
  const canStock = hasPermission("inventory.update");

  const products = useApiQuery<Product[]>(`/products${qs({ page, limit: 20, search: q, category, status: canUpdate ? status : "", availability, sort })}`);
  const categories = useApiQuery<Category[]>(hasPermission("categories.view") ? "/categories" : null);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => (fn(v), setPage(1));

  const replace = (p: Product) => products.setData((list) => list?.map((x) => (x._id === p._id ? { ...x, ...p } : x)) ?? list);

  const setProductStatus = async (p: Product, next: Status) => {
    const res = await action<Product>(`/products/${p._id}/status`, { method: "PATCH", json: { status: next } });
    if (res) replace(res.data);
  };

  const remove = async (p: Product) => {
    const ok = await confirm({
      title: "Delete product?",
      text: `"${p.productTitle}" will be deleted. If it appears in any order it is made inactive instead.`,
      confirmText: "Yes, Delete",
    });
    if (!ok) return;
    try {
      // DELETE /products/:id → 200 in both cases; `data.deleted` says whether it was removed or only deactivated
      const res = await api<ProductDeleteResult>(`/products/${p._id}`, { method: "DELETE" });
      if (res.data.deleted) {
        toast.success(res.message ?? "Product deleted successfully");
        const last = products.data?.length === 1;
        products.setData((list) => list?.filter((x) => x._id !== p._id) ?? list);
        // Emptied a later page: step back, otherwise refresh so pagination totals stay right
        if (last && page > 1) setPage(page - 1);
        else products.reload();
      } else {
        toast.warning(res.message ?? "Product has orders, so it was deactivated instead of deleted");
        replace({ ...p, status: res.data.status ?? "INACTIVE" });
        // Hidden by the "Active" filter now
        if (status === "ACTIVE") products.reload();
      }
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete product"));
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Products Catalog" subtitle="Manage products, prices, stock and visibility">
        {canCreate && (
          <Link href={`${BASE}/products/add`}>
            <PrimaryButton>
              <CirclePlus className="mr-2 h-4 w-4" /> Add New Product
            </PrimaryButton>
          </Link>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={reset(setSearch)} placeholder="Search by product title..." />
        {categories.data && (
          <select className={selectClass} value={category} onChange={(e) => reset(setCategory)(e.target.value)}>
            <option value="">All categories</option>
            {categories.data.map((c) => (
              <option key={c._id} value={c._id}>
                {c.path ?? c.name}
              </option>
            ))}
          </select>
        )}
        {canUpdate && (
          <select className={selectClass} value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        )}
        <select className={selectClass} value={availability} onChange={(e) => reset(setAvailability)(e.target.value)}>
          <option value="">Any stock</option>
          <option value="IN_STOCK">In stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
        <select className={selectClass} value={sort} onChange={(e) => reset(setSort)(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="title_asc">Title A–Z</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {products.loading && !products.data ? (
          <Spinner label="Loading products..." />
        ) : products.error ? (
          <ErrorBox message={products.error} onRetry={products.reload} />
        ) : !products.data?.length ? (
          <EmptyState title="No products found" text={search ? "No product matches your search." : "Create your first product to fill the store."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.data.map((p) => (
                  <tr key={p._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={p.thumbnail} alt={p.productTitle} />
                        <div className="flex min-w-0 flex-col">
                          <span className="line-clamp-1 text-sm font-bold text-slate-900">{p.productTitle}</span>
                          <span className="font-mono text-slate-400">{p.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold whitespace-nowrap text-slate-700">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {p.categoryId?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900">{formatBDT(p.finalPrice)}</div>
                      {p.discountPercent > 0 && (
                        <div className="text-slate-400">
                          <s>{formatBDT(p.customerSellPrice)}</s> · {p.discountPercent}% off
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <StatusPill value={p.availability} />
                        {p.stock != null && (
                          <button
                            disabled={!canStock}
                            onClick={() => setStockFor(p)}
                            className={`font-semibold text-slate-600 ${canStock ? "cursor-pointer underline decoration-dotted hover:text-blue-600" : ""}`}
                          >
                            {p.stock} in stock
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {canUpdate && <Toggle checked={p.status === "ACTIVE"} onChange={(v) => setProductStatus(p, v ? "ACTIVE" : "INACTIVE")} />}
                        <StatusPill value={p.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === "ACTIVE" && (
                          <Link href={`/product/${p.slug}`} target="_blank" title="View in store" className="p-1.5 text-slate-400 transition hover:text-emerald-600">
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        {canUpdate && (
                          <Link href={`${BASE}/products/edit/${p._id}`} title="Edit" className="p-1.5 text-slate-400 transition hover:text-amber-600">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}
                        {canDelete && (
                          <button onClick={() => remove(p)} title="Delete" className="cursor-pointer p-1.5 text-slate-400 transition hover:text-rose-600">
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
        <Pager pagination={products.pagination} onPage={setPage} />
      </div>

      {stockFor && <StockModal product={stockFor} onClose={() => setStockFor(null)} onSaved={replace} />}
    </div>
  );
}

function StockModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: (p: Product) => void }) {
  const action = useApiAction();
  const [mode, setMode] = useState<"set" | "adjust">("adjust");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const n = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(n) && (mode === "adjust" ? n !== 0 : n >= 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    const res = await action<Product>(`/products/${product._id}/stock`, { method: "PATCH", json: mode === "set" ? { stock: n } : { adjustBy: n } }, "Stock updated");
    setSaving(false);
    if (res) {
      onSaved(res.data);
      onClose();
    }
  };

  return (
    <Modal open onClose={onClose} className="max-w-sm">
      <form onSubmit={submit} className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Update stock</h2>
          <p className="text-xs text-slate-500">
            {product.productTitle} · currently <b>{product.stock}</b>
          </p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {(["adjust", "set"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 cursor-pointer rounded-lg py-1.5 ${mode === m ? "bg-white shadow" : "text-slate-500"}`}>
              {m === "adjust" ? "Add / remove" : "Set exact value"}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{mode === "adjust" ? "Change by (e.g. 10 or -3)" : "New stock"}</span>
          <input type="number" step={1} className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={saving} disabled={!valid}>
            Save
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
