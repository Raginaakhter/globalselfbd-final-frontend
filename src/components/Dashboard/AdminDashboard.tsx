"use client";

import { useCallback, useState } from "react";
import { Ban, CalendarClock, CircleCheck, CircleX, Clock, Package, PackageX, ShoppingBag, Truck, Users, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminOrderListItem, Product } from "@/lib/backend-types";
import { BASE } from "./AppSidebar";
import DashboardHeader from "./DashboardHeader";
import { StatCard } from "./StatCards";
import { qs, useApiQuery, type Pagination } from "./api";
import { OrdersTable } from "./pages/orderShared";
import SalesOverview from "./SalesOverview";

type OrdersResponse = { orders: AdminOrderListItem[]; pagination: Pagination };

// Bangladesh date (the backend filters order dates in Bangladesh time).
const todayBD = () => new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10);

/** Total count for one list query; asks for a single row so only the pagination total matters. */
function useCount(path: string | null, orders: boolean) {
  const res = useApiQuery<OrdersResponse | unknown[]>(path ? `${path}${path.includes("?") ? "&" : "?"}limit=1` : null);
  const total = orders ? (res.data as OrdersResponse | null)?.pagination.total : res.pagination?.total;
  return { value: total, loading: res.loading, error: res.error };
}

export default function AdminDashboard() {
  // Refresh remounts the body, which re-runs every query.
  const [tick, setTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => new Date());
  const refresh = useCallback(() => {
    setTick((t) => t + 1);
    setLastUpdated(new Date());
  }, []);
  return <DashboardBody key={tick} lastUpdated={lastUpdated} onRefresh={refresh} />;
}

function DashboardBody({ lastUpdated, onRefresh }: { lastUpdated: Date | null; onRefresh: () => void }) {
  const { hasPermission } = useAuth();

  const canOrders = hasPermission("orders.viewAll");
  const canProducts = hasPermission("products.view");
  const canUsers = hasPermission("users.view");
  const o = (params: Record<string, string>) => (canOrders ? `/admin/orders${qs(params)}` : null);
  const today = { fromDate: todayBD(), toDate: todayBD() };

  const counts: (StatDef & { count: ReturnType<typeof useCount> })[] = [
    { title: "Total Orders", icon: ShoppingBag, colorBg: "bg-blue-50", textColor: "text-blue-600", link: `${BASE}/orders`, count: useCount(o({}), true), show: canOrders },
    { title: "Pre-Orders", icon: CalendarClock, colorBg: "bg-purple-50", textColor: "text-purple-600", link: `${BASE}/pre-orders`, count: useCount(o({ type: "preOrder" }), true), show: canOrders },
    { title: "Today's Orders", icon: Clock, colorBg: "bg-sky-50", textColor: "text-sky-600", link: `${BASE}/orders`, count: useCount(o(today), true), show: canOrders },
    { title: "Pending", icon: Clock, colorBg: "bg-amber-50", textColor: "text-amber-600", link: `${BASE}/orders`, count: useCount(o({ status: "PENDING" }), true), show: canOrders },
    { title: "Shipped", icon: Truck, colorBg: "bg-violet-50", textColor: "text-violet-600", link: `${BASE}/orders`, count: useCount(o({ status: "SHIPPED" }), true), show: canOrders },
    { title: "Delivered", icon: CircleCheck, colorBg: "bg-emerald-50", textColor: "text-emerald-600", link: `${BASE}/orders`, count: useCount(o({ status: "DELIVERED" }), true), show: canOrders },
    { title: "Today's Cancelled", icon: Ban, colorBg: "bg-red-50", textColor: "text-red-600", link: `${BASE}/orders`, count: useCount(o({ ...today, status: "CANCELLED" }), true), show: canOrders },
    { title: "Cancelled", icon: CircleX, colorBg: "bg-rose-50", textColor: "text-rose-600", link: `${BASE}/orders`, count: useCount(o({ status: "CANCELLED" }), true), show: canOrders },
    { title: "Products", icon: Package, colorBg: "bg-indigo-50", textColor: "text-indigo-600", link: `${BASE}/products`, count: useCount(canProducts ? "/products" : null, false), show: canProducts },
    { title: "Out of Stock", icon: PackageX, colorBg: "bg-orange-50", textColor: "text-orange-600", link: `${BASE}/products`, count: useCount(canProducts ? "/products?availability=OUT_OF_STOCK" : null, false), show: canProducts },
    { title: "Users", icon: Users, colorBg: "bg-teal-50", textColor: "text-teal-600", link: `${BASE}/users`, count: useCount(canUsers ? "/users" : null, false), show: canUsers },
  ];

  const recent = useApiQuery<OrdersResponse>(canOrders ? `/admin/orders?limit=8` : null);
  // The backend date filter uses the order date, so this is "placed today and since cancelled"
  const cancelledToday = useApiQuery<OrdersResponse>(o({ ...today, status: "CANCELLED", limit: "20" }));
  const lowStock = useApiQuery<Product[]>(hasPermission("inventory.view") ? `/products?availability=OUT_OF_STOCK&limit=5` : null);
  const isFetching = counts.some((c) => c.count.loading) || recent.loading || cancelledToday.loading;

  return (
    <div className="min-h-screen space-y-6">
      <DashboardHeader lastUpdated={lastUpdated} onRefresh={onRefresh} isFetching={isFetching} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {counts
          .filter((c) => c.show)
          .map(({ count, show: _show, ...s }) => (
            <StatCard key={s.title} {...s} value={count.error ? "!" : count.value == null ? "…" : count.value.toLocaleString("en-US")} />
          ))}
      </div>

      {hasPermission("sales.view") && <SalesOverview />}

      {canOrders && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-extrabold tracking-wide text-slate-700 uppercase">Recent orders</h2>
          <OrdersTable
            orders={recent.data?.orders}
            loading={recent.loading}
            error={recent.error}
            pagination={null}
            onPage={() => {}}
            onRetry={recent.reload}
          />
        </section>
      )}

      {canOrders && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-rose-700 uppercase">
              <Ban className="h-4 w-4" /> Today&apos;s cancelled orders
              {cancelledToday.data && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">{cancelledToday.data.pagination.total}</span>
              )}
            </h2>
            <p className="text-xs text-slate-400">Orders placed today that were cancelled (Bangladesh time)</p>
          </div>
          <OrdersTable
            orders={cancelledToday.data?.orders}
            loading={cancelledToday.loading}
            error={cancelledToday.error}
            pagination={null}
            onPage={() => {}}
            onRetry={cancelledToday.reload}
            emptyText="No orders have been cancelled today."
          />
        </section>
      )}

      {!!lowStock.data?.length && (
        <section className="rounded-3xl border border-orange-200 bg-orange-50/60 p-6">
          <h2 className="mb-3 text-sm font-extrabold text-orange-800">Out of stock</h2>
          <ul className="space-y-1 text-sm text-orange-900">
            {lowStock.data.map((p) => (
              <li key={p._id}>
                <a href={`${BASE}/products/edit/${p._id}`} className="hover:underline">
                  {p.productTitle}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

interface StatDef {
  title: string;
  icon: LucideIcon;
  colorBg: string;
  textColor: string;
  link: string;
  show: boolean;
}
