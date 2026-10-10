"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye } from "lucide-react";
import type { Category, InventoryRow, StockStatus } from "@/lib/backend-types";
import { qs, useApiQuery, type Pagination } from "../../api";
import { formatBDT } from "../../format";
import {
  EmptyState,
  ErrorBox,
  PageHeader,
  Pager,
  SearchBox,
  Spinner,
  selectClass,
  useDebounced,
} from "../../ui";
import { INVENTORY_BASE, StockStatusBadge } from "./shared";

const STOCK_STATUS_OPTIONS: { value: StockStatus | ""; label: string }[] = [
  { value: "", label: "All stock" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "stockDesc", label: "Highest stock" },
  { value: "stockAsc", label: "Lowest stock" },
  { value: "titleAsc", label: "Title A → Z" },
];

export default function InventoryProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatus | "">("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const categories = useApiQuery<Category[]>("/categories?flat=true");
  const inventory = useApiQuery<{ items: InventoryRow[]; pagination: Pagination }>(
    `/admin/inventory${qs({
      search: debounced,
      category,
      stockStatus,
      sort,
      page,
      limit: 20,
      includeSubcategories: true,
    })}`
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Product Inventory"
        subtitle="Current stock, reserved, available, sold, revenue, COGS, profit and margin — one row per product."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by title, slug or SKU..." />
        <select
          className={selectClass}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c._id} value={c._id}>
              {c.path ?? c.name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={stockStatus}
          onChange={(e) => { setStockStatus(e.target.value as StockStatus | ""); setPage(1); }}
        >
          {STOCK_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select className={selectClass} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {inventory.loading && !inventory.data ? (
          <Spinner label="Loading inventory..." />
        ) : inventory.error ? (
          <ErrorBox message={inventory.error} onRetry={inventory.reload} />
        ) : !inventory.data?.items.length ? (
          <EmptyState title="No products found" text="Try different filters, or add products to your catalog first." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-3 py-3.5">SKU</th>
                  <th className="px-3 py-3.5 text-right">Stock</th>
                  <th className="px-3 py-3.5 text-right">Reserved</th>
                  <th className="px-3 py-3.5 text-right">Available</th>
                  <th className="px-3 py-3.5 text-right">Threshold</th>
                  <th className="px-3 py-3.5 text-right">Sold</th>
                  <th className="px-3 py-3.5 text-right">Revenue</th>
                  <th className="px-3 py-3.5 text-right">COGS</th>
                  <th className="px-3 py-3.5 text-right">Profit</th>
                  <th className="px-3 py-3.5 text-right">Margin</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.data.items.map((row) => (
                  <tr key={row._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <Link
                        href={`${INVENTORY_BASE}/products/${row._id}`}
                        className="text-sm font-bold text-slate-900 hover:underline"
                      >
                        {row.productTitle}
                      </Link>
                      {row.isPreOrder && (
                        <div className="mt-0.5 text-[10px] font-extrabold uppercase text-purple-600">Pre-order</div>
                      )}
                    </td>
                    <td className="px-3 py-4 font-mono text-slate-500">{row.sku || "—"}</td>
                    <td className="px-3 py-4 text-right font-semibold text-slate-800">{row.stock.toLocaleString()}</td>
                    <td className="px-3 py-4 text-right text-slate-500">{row.reserved.toLocaleString()}</td>
                    <td className="px-3 py-4 text-right font-bold text-slate-900">{row.available.toLocaleString()}</td>
                    <td className="px-3 py-4 text-right text-slate-500">{row.lowStockThreshold}</td>
                    <td className="px-3 py-4 text-right text-slate-500">{row.soldQuantity.toLocaleString()}</td>
                    <td className="px-3 py-4 text-right text-slate-700">{formatBDT(row.soldRevenue)}</td>
                    <td className="px-3 py-4 text-right text-slate-500">{formatBDT(row.cogs)}</td>
                    <td className="px-3 py-4 text-right font-bold text-emerald-700">{formatBDT(row.profit)}</td>
                    <td className="px-3 py-4 text-right text-slate-500">{row.margin.toFixed(2)}%</td>
                    <td className="px-3 py-4">
                      <StockStatusBadge value={row.stockStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`${INVENTORY_BASE}/products/${row._id}`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-700"
                        title="View / edit"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={inventory.data?.pagination ?? null} onPage={setPage} />
      </div>
    </div>
  );
}
