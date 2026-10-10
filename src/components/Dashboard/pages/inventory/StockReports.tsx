"use client";

import Link from "next/link";
import { useApiQuery } from "../../api";
import {
  EmptyState,
  ErrorBox,
  PageHeader,
  Spinner,
} from "../../ui";
import { INVENTORY_BASE } from "./shared";

interface LowStockRow {
  _id: string;
  productTitle: string;
  sku: string | null;
  category?: string;
  stock: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
}

export function LowStockPage() {
  const low = useApiQuery<LowStockRow[]>("/admin/inventory/reports/low-stock");

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Low Stock"
        subtitle="Products with available stock at or below their configured threshold."
      />

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {low.loading && !low.data ? (
          <Spinner label="Loading low-stock products..." />
        ) : low.error ? (
          <ErrorBox message={low.error} onRetry={low.reload} />
        ) : !low.data?.length ? (
          <EmptyState title="Nothing low on stock" text="All products are above their low-stock threshold." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-amber-50/70 font-bold tracking-wider text-amber-700 uppercase">
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-3 py-3.5">SKU</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5 text-right">Stock</th>
                  <th className="px-3 py-3.5 text-right">Reserved</th>
                  <th className="px-3 py-3.5 text-right">Available</th>
                  <th className="px-3 py-3.5 text-right">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {low.data.map((row) => (
                  <tr key={row._id} className="transition hover:bg-amber-50/40">
                    <td className="px-6 py-3.5">
                      <Link href={`${INVENTORY_BASE}/products/${row._id}`} className="text-sm font-bold text-slate-900 hover:underline">
                        {row.productTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-slate-500">{row.sku || "—"}</td>
                    <td className="px-3 py-3.5 text-slate-600">{row.category || "—"}</td>
                    <td className="px-3 py-3.5 text-right text-slate-800">{row.stock}</td>
                    <td className="px-3 py-3.5 text-right text-slate-500">{row.reserved}</td>
                    <td className="px-3 py-3.5 text-right font-bold text-amber-700">{row.available}</td>
                    <td className="px-3 py-3.5 text-right text-slate-500">{row.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface OutOfStockRow {
  _id: string;
  productTitle: string;
  sku: string | null;
  stock: number;
  reserved: number;
}

export function OutOfStockPage() {
  const out = useApiQuery<OutOfStockRow[]>("/admin/inventory/reports/out-of-stock");

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Out of Stock"
        subtitle="Products with no available stock. Receive a shipment or run an adjustment to restock."
      />

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {out.loading && !out.data ? (
          <Spinner label="Loading out-of-stock products..." />
        ) : out.error ? (
          <ErrorBox message={out.error} onRetry={out.reload} />
        ) : !out.data?.length ? (
          <EmptyState title="Nothing out of stock" text="Everything with inventory is still available." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-rose-50/70 font-bold tracking-wider text-rose-700 uppercase">
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-3 py-3.5">SKU</th>
                  <th className="px-3 py-3.5 text-right">Stock</th>
                  <th className="px-3 py-3.5 text-right">Reserved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {out.data.map((row) => (
                  <tr key={row._id} className="transition hover:bg-rose-50/40">
                    <td className="px-6 py-3.5">
                      <Link href={`${INVENTORY_BASE}/products/${row._id}`} className="text-sm font-bold text-slate-900 hover:underline">
                        {row.productTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-slate-500">{row.sku || "—"}</td>
                    <td className="px-3 py-3.5 text-right text-slate-800">{row.stock}</td>
                    <td className="px-3 py-3.5 text-right text-slate-500">{row.reserved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
