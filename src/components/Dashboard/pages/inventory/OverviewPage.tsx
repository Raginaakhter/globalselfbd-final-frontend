"use client";

import {
  AlertTriangle,
  Boxes,
  Factory,
  PackageOpen,
  PackageX,
  ReceiptText,
  TrendingUp,
  Truck,
  Wallet,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InventorySummary } from "@/lib/backend-types";
import { useApiQuery } from "../../api";
import { formatBDT } from "../../format";
import { ErrorBox, PageHeader, Spinner } from "../../ui";

interface Card {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
  hint?: string;
}

export default function OverviewPage() {
  const summary = useApiQuery<InventorySummary>("/admin/inventory/summary");

  if (summary.loading && !summary.data) return <Spinner label="Loading inventory summary..." />;
  if (summary.error) return <ErrorBox message={summary.error} onRetry={summary.reload} />;
  if (!summary.data) return null;

  const d = summary.data;
  const cards: Card[] = [
    { key: "products", label: "Total products", value: d.totalProducts.toLocaleString(), icon: Boxes, tone: "bg-blue-50 text-blue-700" },
    { key: "stock", label: "Total stock", value: d.totalStock.toLocaleString(), icon: Warehouse, tone: "bg-sky-50 text-sky-700" },
    { key: "available", label: "Available", value: d.availableStock.toLocaleString(), icon: Boxes, tone: "bg-emerald-50 text-emerald-700" },
    { key: "reserved", label: "Reserved", value: d.reservedStock.toLocaleString(), icon: ReceiptText, tone: "bg-indigo-50 text-indigo-700" },
    { key: "low", label: "Low stock", value: d.lowStockCount.toLocaleString(), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    { key: "out", label: "Out of stock", value: d.outOfStockCount.toLocaleString(), icon: PackageX, tone: "bg-rose-50 text-rose-700" },
    { key: "damaged", label: "Damaged", value: d.damagedQuantity.toLocaleString(), icon: PackageOpen, tone: "bg-rose-50 text-rose-700" },
    { key: "returned", label: "Returned", value: d.returnedQuantity.toLocaleString(), icon: PackageOpen, tone: "bg-slate-100 text-slate-700" },
  ];

  const financials: Card[] = [
    { key: "cost", label: "Inventory cost", value: formatBDT(d.inventoryCost), icon: Wallet, tone: "bg-amber-50 text-amber-700" },
    { key: "value", label: "Inventory value", value: formatBDT(d.inventoryValue), icon: Wallet, tone: "bg-emerald-50 text-emerald-700" },
    { key: "revenue", label: "Revenue", value: formatBDT(d.revenue), icon: TrendingUp, tone: "bg-blue-50 text-blue-700" },
    { key: "cogs", label: "COGS", value: formatBDT(d.cogs), icon: TrendingUp, tone: "bg-slate-100 text-slate-700" },
    { key: "profit", label: "Gross profit", value: formatBDT(d.grossProfit), icon: TrendingUp, tone: "bg-emerald-50 text-emerald-700" },
    { key: "margin", label: "Profit margin", value: `${d.profitMargin.toFixed(2)}%`, icon: TrendingUp, tone: "bg-indigo-50 text-indigo-700" },
    { key: "ships", label: "Shipments", value: `${d.shipments.total.toLocaleString()}`, hint: `${d.shipments.pending} pending`, icon: Truck, tone: "bg-sky-50 text-sky-700" },
    { key: "suppliers", label: "Active suppliers", value: d.suppliers.active.toLocaleString(), icon: Factory, tone: "bg-blue-50 text-blue-700" },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Inventory Overview" subtitle="Live totals across every product, lot and shipment." />

      <section>
        <h2 className="mb-3 px-1 text-xs font-extrabold tracking-wider text-slate-500 uppercase">Stock</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c) => (
            <StatCard key={c.key} card={c} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 text-xs font-extrabold tracking-wider text-slate-500 uppercase">Finance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {financials.map((c) => (
            <StatCard key={c.key} card={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ card }: { card: Card }) {
  const Icon = card.icon;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{card.label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-xl font-extrabold text-slate-900">{card.value}</div>
      {card.hint && <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{card.hint}</div>}
    </div>
  );
}
