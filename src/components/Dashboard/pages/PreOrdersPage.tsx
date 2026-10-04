"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  Truck,
  Boxes,
  Bike,
  Package,
  Plus,
  Pencil,
  Trash,
  Tag,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { AdminOrderListItem, Category, Product, ProductDeleteResult, Status } from "@/lib/backend-types";
import { PRE_ORDER_MAX_DAYS, PRE_ORDER_MIN_DAYS } from "@/lib/backend-types";
import { BASE } from "../AppSidebar";
import { errorMessage, qs, useApiAction, useApiQuery, type Pagination } from "../api";
import { formatBDT } from "../format";
import { StatCard } from "../StatCards";
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
import { OrderFilterBar, OrdersTable, useOrderFilters } from "./orderShared";
import { ProductThumb } from "./ProductsCatalog";

type OrdersResponse = { orders: AdminOrderListItem[]; pagination: Pagination };

export default function PreOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  const { hasPermission } = useAuth();
  const canCreateProduct = hasPermission("products.create");

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Pre-Orders Management"
        subtitle="Manage custom pre-ordered customer orders, promised fulfilment delivery windows, ETA dates, and pre-order catalog products."
      >
        <div className="flex items-center gap-2">
          {activeTab === "products" && canCreateProduct && (
            <Link href={`${BASE}/products/add`}>
              <PrimaryButton>
                <Plus className="mr-1.5 h-4 w-4" /> Add Pre-Order Product
              </PrimaryButton>
            </Link>
          )}
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === "orders"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarClock className="h-4 w-4" /> Pre-Order Orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === "products"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="h-4 w-4" /> Pre-Order Products Catalog
        </button>
      </div>

      {activeTab === "orders" ? <PreOrderOrdersSection /> : <PreOrderProductsSection />}
    </div>
  );
}

function PreOrderOrdersSection() {
  const { filters, setFilters, page, setPage } = useOrderFilters({ type: "preOrder" });
  const search = useDebounced(filters.search);

  // Always filters to type=preOrder on this page
  const orders = useApiQuery<OrdersResponse>(
    `/admin/orders${qs({ ...filters, type: "preOrder", search, page, limit: 20 })}`
  );

  // Stat counters for pre-orders
  const totalCount = useApiQuery<OrdersResponse>(`/admin/orders${qs({ type: "preOrder", limit: 1 })}`);
  const pendingCount = useApiQuery<OrdersResponse>(`/admin/orders${qs({ type: "preOrder", status: "PENDING", limit: 1 })}`);
  const processingCount = useApiQuery<OrdersResponse>(`/admin/orders${qs({ type: "preOrder", status: "PROCESSING", limit: 1 })}`);
  const readyCount = useApiQuery<OrdersResponse>(`/admin/orders${qs({ type: "preOrder", status: "READY_TO_SHIP", limit: 1 })}`);
  const shippedCount = useApiQuery<OrdersResponse>(`/admin/orders${qs({ type: "preOrder", status: "SHIPPED", limit: 1 })}`);
  const deliveredCount = useApiQuery<OrdersResponse>(`/admin/orders${qs({ type: "preOrder", status: "DELIVERED", limit: 1 })}`);

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Pre-Orders"
          value={totalCount.data?.pagination.total != null ? totalCount.data.pagination.total.toLocaleString() : "…"}
          icon={CalendarClock}
          colorBg="bg-purple-50"
          textColor="text-purple-600"
          link={`${BASE}/pre-orders`}
        />
        <StatCard
          title="Pending"
          value={pendingCount.data?.pagination.total != null ? pendingCount.data.pagination.total.toLocaleString() : "…"}
          icon={Clock}
          colorBg="bg-amber-50"
          textColor="text-amber-600"
          link={`${BASE}/pre-orders?status=PENDING`}
        />
        <StatCard
          title="Processing"
          value={processingCount.data?.pagination.total != null ? processingCount.data.pagination.total.toLocaleString() : "…"}
          icon={Boxes}
          colorBg="bg-indigo-50"
          textColor="text-indigo-600"
          link={`${BASE}/pre-orders?status=PROCESSING`}
        />
        <StatCard
          title="Ready to Ship"
          value={readyCount.data?.pagination.total != null ? readyCount.data.pagination.total.toLocaleString() : "…"}
          icon={Truck}
          colorBg="bg-cyan-50"
          textColor="text-cyan-600"
          link={`${BASE}/pre-orders?status=READY_TO_SHIP`}
        />
        <StatCard
          title="Shipped"
          value={shippedCount.data?.pagination.total != null ? shippedCount.data.pagination.total.toLocaleString() : "…"}
          icon={Bike}
          colorBg="bg-violet-50"
          textColor="text-violet-600"
          link={`${BASE}/pre-orders?status=SHIPPED`}
        />
        <StatCard
          title="Delivered"
          value={deliveredCount.data?.pagination.total != null ? deliveredCount.data.pagination.total.toLocaleString() : "…"}
          icon={CheckCircle2}
          colorBg="bg-emerald-50"
          textColor="text-emerald-600"
          link={`${BASE}/pre-orders?status=DELIVERED`}
        />
      </div>

      <OrderFilterBar value={filters} onChange={setFilters} hideTypeFilter />

      <OrdersTable
        orders={orders.data?.orders}
        loading={orders.loading}
        error={orders.error}
        pagination={orders.data?.pagination ?? null}
        onPage={setPage}
        onRetry={orders.reload}
        emptyText="No pre-orders found. Customer pre-orders will appear here with delivery windows and ETA dates."
      />
    </div>
  );
}

function PreOrderProductsSection() {
  const { api, hasPermission } = useAuth();
  const action = useApiAction();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [preOrderFor, setPreOrderFor] = useState<Product | null>(null);
  const q = useDebounced(search);

  const canUpdate = hasPermission("products.update");
  const canDelete = hasPermission("products.delete");

  // Fetch products with search and category
  const products = useApiQuery<Product[]>(
    `/products${qs({ page, limit: 20, search: q, category, status: canUpdate ? status : "" })}`
  );
  const categories = useApiQuery<Category[]>(hasPermission("categories.view") ? "/categories" : null);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  const replace = (p: Product) =>
    products.setData((list) => list?.map((x) => (x._id === p._id ? { ...x, ...p } : x)) ?? list);

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
      const res = await api<ProductDeleteResult>(`/products/${p._id}`, { method: "DELETE" });
      if (res.data.deleted) {
        toast.success(res.message ?? "Product deleted successfully");
        products.setData((list) => list?.filter((x) => x._id !== p._id) ?? list);
        products.reload();
      } else {
        toast.warning(res.message ?? "Product has orders, so it was deactivated instead of deleted");
        replace({ ...p, status: res.data.status ?? "INACTIVE" });
      }
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete product"));
    }
  };

  // Filter list to pre-order products only
  const preOrderList = products.data?.filter((p) => p.isPreOrder) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={reset(setSearch)} placeholder="Search pre-order products..." />
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
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {products.loading && !products.data ? (
          <Spinner label="Loading pre-order products..." />
        ) : products.error ? (
          <ErrorBox message={products.error} onRetry={products.reload} />
        ) : !preOrderList.length ? (
          <EmptyState
            title="No pre-order products found"
            text={search ? "No pre-order product matches your search." : "No products are currently marked as Pre-Order in the catalog."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Pre-Order Window</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preOrderList.map((p) => (
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
                        <button
                          disabled={!canUpdate}
                          onClick={() => setPreOrderFor(p)}
                          title={canUpdate ? "Click to edit pre-order window" : undefined}
                          className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-xs font-bold text-white uppercase shadow-xs ${
                            canUpdate ? "cursor-pointer hover:brightness-110" : ""
                          }`}
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                          <span>{p.preOrderMinDays ?? PRE_ORDER_MIN_DAYS} Days Delivery</span>
                          {canUpdate && <Pencil className="h-2.5 w-2.5 ml-0.5 opacity-80" />}
                        </button>
                        <span className="text-[10px] font-medium text-slate-400">No stock deducted</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <Toggle
                            checked={p.status === "ACTIVE"}
                            onChange={(v) => setProductStatus(p, v ? "ACTIVE" : "INACTIVE")}
                          />
                        )}
                        <StatusPill value={p.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === "ACTIVE" && (
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            title="View in store"
                            className="p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => setPreOrderFor(p)}
                            title="Edit pre-order settings"
                            className="p-1.5 rounded-lg text-violet-500 transition hover:bg-violet-50 hover:text-violet-700"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </button>
                        )}
                        {canUpdate && (
                          <Link
                            href={`${BASE}/products/edit/${p._id}`}
                            title="Edit full product details"
                            className="p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => remove(p)}
                            title="Delete product"
                            className="cursor-pointer p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                          >
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

      {preOrderFor && (
        <QuickPreOrderProductModal
          product={preOrderFor}
          onClose={() => setPreOrderFor(null)}
          onSaved={replace}
        />
      )}
    </div>
  );
}

function QuickPreOrderProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const action = useApiAction();
  const [enabled, setEnabled] = useState(product.isPreOrder ?? true);
  const [days, setDays] = useState(
    String(product.isPreOrder && product.preOrderMinDays ? product.preOrderMinDays : PRE_ORDER_MIN_DAYS)
  );
  const [saving, setSaving] = useState(false);
  const n = Number(days);
  const validDays = Number.isInteger(n) && n >= PRE_ORDER_MIN_DAYS && n <= PRE_ORDER_MAX_DAYS;
  const valid = !enabled || validDays;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    const res = await action<Product>(`/products/${product._id}/pre-order`, {
      method: "PATCH",
      json: enabled ? { isPreOrder: true, preOrderMinDays: n } : { isPreOrder: false },
    });
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
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <CalendarClock className="h-5 w-5 text-violet-600" /> Edit Pre-Order Settings
          </h2>
          <p className="text-xs text-slate-500">{product.productTitle}</p>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
          <span className="text-sm font-bold text-slate-800">
            Sell as Pre-Order
            <span className="block text-[11px] font-medium text-slate-500">
              No stock needed; stock is not deducted on purchase.
            </span>
          </span>
          <Toggle checked={enabled} onChange={setEnabled} color="peer-checked:bg-violet-600" size="md" />
        </label>

        {enabled && (
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>
              Promised delivery window ({PRE_ORDER_MIN_DAYS}–{PRE_ORDER_MAX_DAYS} days)
            </span>
            <input
              type="number"
              min={PRE_ORDER_MIN_DAYS}
              max={PRE_ORDER_MAX_DAYS}
              step={1}
              className={inputClass}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              autoFocus
            />
            {!validDays && (
              <span className="text-xs font-semibold text-rose-500">
                Must be a whole number between {PRE_ORDER_MIN_DAYS} and {PRE_ORDER_MAX_DAYS}.
              </span>
            )}
          </label>
        )}

        {!enabled && product.isPreOrder && (
          <p className="text-xs text-amber-600">
            Turning pre-order off resets the delivery days to 0. Existing customer orders keep their snapshot delivery window.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <PrimaryButton type="submit" loading={saving} disabled={!valid}>
            Save Pre-Order Settings
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
