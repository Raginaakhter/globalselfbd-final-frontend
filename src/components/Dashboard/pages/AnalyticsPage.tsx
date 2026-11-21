"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Clock,
  Download,
  Eye,
  Filter,
  Globe,
  LayoutDashboard,
  MapPin,
  MousePointerClick,
  RefreshCw,
  Route,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type {
  AnalyticsActiveVisitors,
  AnalyticsCart,
  AnalyticsCheckout,
  AnalyticsClickRow,
  AnalyticsCustomer,
  AnalyticsDevices,
  AnalyticsEvent,
  AnalyticsFunnel,
  AnalyticsJourney,
  AnalyticsLocation,
  AnalyticsOverview,
  AnalyticsPageRow,
  AnalyticsPagesSort,
  AnalyticsPreset,
  AnalyticsProductDetail,
  AnalyticsProductRow,
  AnalyticsSearch,
  AnalyticsSessionDetail,
  AnalyticsSessionRow,
  AnalyticsSource,
  AnalyticsTopElement,
  AnalyticsTrends,
  AnalyticsVisitorProfile,
  AnalyticsVisitorRow,
} from "@/lib/backend-types";
import { useAuth } from "@/context/AuthContext";
import { qs, useApiQuery } from "../api";
import { formatBDT } from "../format";
import {
  EmptyState,
  ErrorBox,
  Modal,
  PageHeader,
  Pager,
  PrimaryButton,
  Spinner,
  inputClass,
  labelClass,
  selectClass,
} from "../ui";

type SectionKey =
  | "overview"
  | "realtime"
  | "sources"
  | "pages"
  | "clicks"
  | "products"
  | "visitors"
  | "journey"
  | "funnel"
  | "cart"
  | "customers"
  | "searches"
  | "devices";

const SECTIONS: { key: SectionKey; title: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", title: "Overview", icon: LayoutDashboard },
  { key: "realtime", title: "Real-Time", icon: Activity },
  { key: "sources", title: "Traffic Sources", icon: Globe },
  { key: "pages", title: "Pages & Engagement", icon: Eye },
  { key: "clicks", title: "Click Analytics", icon: MousePointerClick },
  { key: "products", title: "Product Analytics", icon: ShoppingBag },
  { key: "visitors", title: "Visitors & Sessions", icon: Users },
  { key: "journey", title: "Customer Journey", icon: Route },
  { key: "funnel", title: "Conversion Funnel", icon: TrendingUp },
  { key: "cart", title: "Cart & Checkout", icon: ShoppingCart },
  { key: "customers", title: "Customer Analytics", icon: UserRound },
  { key: "searches", title: "Search Analytics", icon: Search },
  { key: "devices", title: "Devices & Locations", icon: Smartphone },
];

const PRESETS: { value: AnalyticsPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7d", label: "Last 7 days" },
  { value: "last30d", label: "Last 30 days" },
  { value: "last90d", label: "Last 90 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
];

type RangeMode = "preset" | "custom";
interface Range {
  mode: RangeMode;
  preset: AnalyticsPreset;
  from: string;
  to: string;
}
const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

/** Backend query string for the current range + a cache-buster nonce used by the refresh button. */
const rangeParams = (r: Range, nonce: number) =>
  r.mode === "preset"
    ? qs({ preset: r.preset, _r: nonce || undefined })
    : qs({ from: r.from, to: r.to, _r: nonce || undefined });

const num = (n?: number | null) => (n == null ? "—" : n.toLocaleString("en-US"));
const pct = (n?: number | null, digits = 2) => (n == null ? "—" : `${n.toFixed(digits)}%`);
const secondsLabel = (s?: number | null) => {
  if (s == null) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${m}m ${rest}s` : `${m}m`;
};
const shortDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
const shortDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16"];

/* ============================================================
   Main page
   ============================================================ */

export default function AnalyticsPage() {
  const [active, setActive] = useState<SectionKey>("overview");
  const [range, setRange] = useState<Range>({
    mode: "preset",
    preset: "last7d",
    from: daysAgoIso(7),
    to: todayIso(),
  });
  const [nonce, setNonce] = useState(0);
  const query = rangeParams(range, nonce);

  const { accessToken, hasPermission } = useAuth();
  const canExport = useMemo(() => hasPermission("analytics.export"), [hasPermission]);

  const handleExport = async () => {
    if (!accessToken) {
      toast.error("Please sign in again.");
      return;
    }
    const params =
      range.mode === "preset" ? `preset=${range.preset}` : `from=${range.from}&to=${range.to}`;
    try {
      const res = await fetch(`/api/v1/admin/analytics/export?${params}&limit=50000`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const label = range.mode === "preset" ? range.preset : `${range.from}-to-${range.to}`;
      a.href = url;
      a.download = `analytics-events-${label}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export started — check your downloads.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export CSV");
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Analytics"
        subtitle="Visitor, engagement and sales analytics across the storefront — driven entirely by the backend analytics API."
      >
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        {canExport && (
          <PrimaryButton type="button" onClick={handleExport} className="h-10">
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </PrimaryButton>
        )}
      </PageHeader>

      <RangeBar range={range} onChange={setRange} />

      <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
        {SECTIONS.map(({ key, title, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              active === key ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {title}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-6">
        {active === "overview" && <OverviewSection query={query} />}
        {active === "realtime" && <RealTimeSection query={query} nonce={nonce} />}
        {active === "sources" && <SourcesSection query={query} />}
        {active === "pages" && <PagesSection query={query} />}
        {active === "clicks" && <ClicksSection query={query} />}
        {active === "products" && <ProductsSection query={query} />}
        {active === "visitors" && <VisitorsSection query={query} />}
        {active === "journey" && <JourneySection query={query} />}
        {active === "funnel" && <FunnelSection query={query} />}
        {active === "cart" && <CartSection query={query} />}
        {active === "customers" && <CustomersSection query={query} />}
        {active === "searches" && <SearchesSection query={query} />}
        {active === "devices" && <DevicesSection query={query} />}
      </div>
    </div>
  );
}

/* ============================================================
   Range bar
   ============================================================ */

function RangeBar({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Filter className="h-4 w-4" />
        Date range
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange({ ...range, mode: "preset", preset: p.value })}
            className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              range.mode === "preset" && range.preset === p.value
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...range, mode: "custom" })}
          className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            range.mode === "custom" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Custom
        </button>
      </div>
      {range.mode === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>From</span>
            <input
              type="date"
              className={inputClass}
              value={range.from}
              onChange={(e) => onChange({ ...range, from: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>To</span>
            <input
              type="date"
              className={inputClass}
              value={range.to}
              onChange={(e) => onChange({ ...range, to: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Shared layout primitives for sections
   ============================================================ */

function Card({
  title,
  action,
  children,
  compact,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`rounded-3xl border border-slate-200/80 bg-white shadow-xs ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  sub,
  tint = "bg-blue-50 text-blue-700",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{label}</span>
        {icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tint}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-1 text-xl font-extrabold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] font-semibold text-slate-500">{sub}</div>}
    </div>
  );
}

function TableWrap({
  loading,
  error,
  reload,
  empty,
  children,
  footer,
}: {
  loading: boolean;
  error: string | null;
  reload: () => void;
  empty: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (loading) return <Spinner label="Loading..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (empty) return <EmptyState title="No data" text="No analytics data in this range yet." />;
  return (
    <>
      <div className="-mx-5 overflow-x-auto sm:-mx-6">
        <div className="min-w-full px-5 sm:px-6">{children}</div>
      </div>
      {footer}
    </>
  );
}

/* ============================================================
   Section: Overview
   ============================================================ */

function OverviewSection({ query }: { query: string }) {
  const overview = useApiQuery<AnalyticsOverview>(`/admin/analytics/overview${query}`);
  const trends = useApiQuery<AnalyticsTrends>(`/admin/analytics/trends${query}`);
  const sources = useApiQuery<AnalyticsSource[]>(`/admin/analytics/sources${query}`);
  const topProducts = useApiQuery<AnalyticsProductRow[]>(`/admin/analytics/products${query}`);

  if (overview.loading && !overview.data) return <Spinner label="Loading overview..." />;
  if (overview.error) return <ErrorBox message={overview.error} onRetry={overview.reload} />;
  const d = overview.data;
  if (!d) return <EmptyState title="No data" />;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Visitors"
          value={num(d.visitors.total)}
          sub={`${num(d.visitors.unique)} unique · ${num(d.visitors.returning)} returning`}
          tint="bg-blue-50 text-blue-700"
          icon={<Users className="h-4 w-4" />}
        />
        <StatTile
          label="Sessions"
          value={num(d.sessions.total)}
          sub={`Avg ${secondsLabel(d.sessions.avgDurationSeconds)} · Bounce ${pct(d.sessions.bounceRate)}`}
          tint="bg-indigo-50 text-indigo-700"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatTile
          label="Engagement"
          value={num(d.engagement.pageViews)}
          sub={`${num(d.engagement.productViews)} product views · ${num(d.engagement.addToCart)} add-to-cart`}
          tint="bg-emerald-50 text-emerald-700"
          icon={<Eye className="h-4 w-4" />}
        />
        <StatTile
          label="Sales"
          value={formatBDT(d.sales.totalRevenue)}
          sub={`${num(d.sales.completedOrders)} orders · Conv ${pct(d.sales.conversionRate)}`}
          tint="bg-amber-50 text-amber-700"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Daily trend" action={<span className="text-[11px] font-semibold text-slate-500">Visitors · Sessions · Revenue</span>}>
          <TrendsChart trends={trends.data} loading={trends.loading} error={trends.error} reload={trends.reload} />
        </Card>
        <Card title="Traffic sources">
          <SourcesPie sources={sources.data ?? []} />
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active now"
          value={num(d.visitors.active)}
          sub="Live visitors on site"
          tint="bg-emerald-50 text-emerald-700"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatTile
          label="Total clicks"
          value={num(d.engagement.totalClicks)}
          tint="bg-rose-50 text-rose-700"
          icon={<MousePointerClick className="h-4 w-4" />}
        />
        <StatTile
          label="Checkout starts"
          value={num(d.engagement.checkoutStarts)}
          tint="bg-sky-50 text-sky-700"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatTile
          label="Cart abandonment"
          value={pct(d.sales.cartAbandonmentRate)}
          tint="bg-orange-50 text-orange-700"
          icon={<ShoppingBag className="h-4 w-4" />}
        />
      </div>

      <Card title="Top products" action={<span className="text-[11px] font-semibold text-slate-500">Views · Add-to-cart · Purchases</span>}>
        <TopProductsTable rows={topProducts.data ?? []} loading={topProducts.loading} />
      </Card>
    </>
  );
}

function TrendsChart({
  trends,
  loading,
  error,
  reload,
}: {
  trends: AnalyticsTrends | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}) {
  if (loading) return <Spinner label="Loading trend..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!trends || trends.days.length === 0) return <EmptyState title="No trend data" />;
  const data = trends.days.map((d) => ({
    day: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    visitors: d.visitors,
    sessions: d.sessions,
    revenue: d.revenue,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="visitors" stroke="#2563eb" fill="url(#visitorsFill)" strokeWidth={2} />
          <Area type="monotone" dataKey="sessions" stroke="#10b981" fill="url(#sessionsFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SourcesPie({ sources }: { sources: AnalyticsSource[] }) {
  const data = sources.slice(0, 6).map((s) => ({ name: s.source || "unknown", value: s.sessions }));
  if (data.length === 0) return <EmptyState title="No source data" />;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopProductsTable({ rows, loading }: { rows: AnalyticsProductRow[]; loading: boolean }) {
  if (loading) return <Spinner label="Loading products..." />;
  if (rows.length === 0) return <EmptyState title="No product analytics yet" />;
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            <th className="px-5 py-3 text-left sm:px-6">Product</th>
            <th className="px-3 py-3 text-right">Views</th>
            <th className="px-3 py-3 text-right">Clicks</th>
            <th className="px-3 py-3 text-right">Add-to-cart</th>
            <th className="px-3 py-3 text-right">Purchases</th>
            <th className="px-3 py-3 text-right">Revenue</th>
            <th className="px-3 py-3 text-right">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((p) => (
            <tr key={p.productId} className="border-b border-slate-50 last:border-0">
              <td className="flex items-center gap-3 px-5 py-3 sm:px-6">
                {p.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-900">{p.productTitle}</div>
                  <div className="text-[10px] text-slate-400">{formatBDT(p.price)}</div>
                </div>
              </td>
              <td className="px-3 py-3 text-right text-xs font-semibold text-slate-700">{num(p.views)}</td>
              <td className="px-3 py-3 text-right text-xs text-slate-600">{num(p.clicks)}</td>
              <td className="px-3 py-3 text-right text-xs text-slate-600">{num(p.addToCart)}</td>
              <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">{num(p.purchases)}</td>
              <td className="px-3 py-3 text-right text-xs font-bold text-slate-900">{formatBDT(p.revenue)}</td>
              <td className="px-3 py-3 text-right text-xs font-semibold text-slate-700">{pct(p.conversionRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   Section: Real-Time
   ============================================================ */

function RealTimeSection({ query, nonce }: { query: string; nonce: number }) {
  // Nonce is already in `query` from the global refresh; include it here too to keep the real-time
  // key stable with the page refresh pattern. The hook reloads whenever `query` changes.
  void nonce;
  const active = useApiQuery<AnalyticsActiveVisitors>(`/admin/analytics/active-visitors${query}`);

  if (active.loading && !active.data) return <Spinner label="Loading live visitors..." />;
  if (active.error) return <ErrorBox message={active.error} onRetry={active.reload} />;
  const d = active.data;
  if (!d) return <EmptyState title="No live visitor data" />;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Active now" value={num(d.count)} tint="bg-emerald-50 text-emerald-700" icon={<Activity className="h-4 w-4" />} />
        <StatTile label="Idle cutoff" value={shortDateTime(d.idleCutoff)} sub={`${d.idleMinutes} min idle`} tint="bg-slate-100 text-slate-600" icon={<Clock className="h-4 w-4" />} />
        <StatTile label="Unique pages" value={num(new Set(d.sessions.map((s) => s.currentPage)).size)} tint="bg-blue-50 text-blue-700" icon={<Eye className="h-4 w-4" />} />
      </div>

      <Card title="Live sessions">
        {d.sessions.length === 0 ? (
          <EmptyState title="No live sessions right now" />
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  <th className="px-5 py-3 text-left sm:px-6">Visitor</th>
                  <th className="px-3 py-3 text-left">Current page</th>
                  <th className="px-3 py-3 text-left">Device</th>
                  <th className="px-3 py-3 text-left">Country</th>
                  <th className="px-3 py-3 text-right">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {d.sessions.map((s) => (
                  <tr key={s.sessionId} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-700 sm:px-6">{s.visitorId.slice(0, 16)}…</td>
                    <td className="px-3 py-3 text-xs text-slate-800">{s.currentPage}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{s.deviceType}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{s.country ?? "—"}</td>
                    <td className="px-3 py-3 text-right text-xs text-slate-500">{shortDateTime(s.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ============================================================
   Section: Traffic Sources
   ============================================================ */

function SourcesSection({ query }: { query: string }) {
  const q = useApiQuery<AnalyticsSource[]>(`/admin/analytics/sources${query}`);
  const rows = q.data ?? [];

  if (q.loading && !q.data) return <Spinner label="Loading traffic sources..." />;
  if (q.error) return <ErrorBox message={q.error} onRetry={q.reload} />;

  const totalSessions = rows.reduce((sum, r) => sum + r.sessions, 0);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Sessions by source">
          {rows.length === 0 ? (
            <EmptyState title="No source data yet" />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="source" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card title="Share">
          <SourcesPie sources={rows} />
        </Card>
      </div>

      <Card title="All sources" action={<span className="text-[11px] font-semibold text-slate-500">{num(totalSessions)} total sessions</span>}>
        {rows.length === 0 ? (
          <EmptyState title="No source data yet" />
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  <th className="px-5 py-3 text-left sm:px-6">Source</th>
                  <th className="px-3 py-3 text-right">Sessions</th>
                  <th className="px-3 py-3 text-right">Unique visitors</th>
                  <th className="px-3 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.source} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 text-xs font-bold text-slate-900 sm:px-6">{r.source || "unknown"}</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-slate-700">{num(r.sessions)}</td>
                    <td className="px-3 py-3 text-right text-xs text-slate-600">{num(r.uniqueVisitors)}</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-slate-700">
                      {totalSessions > 0 ? pct((r.sessions / totalSessions) * 100) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ============================================================
   Section: Pages & Engagement
   ============================================================ */

function PagesSection({ query }: { query: string }) {
  const [sort, setSort] = useState<AnalyticsPagesSort>("views");
  const [page, setPage] = useState(1);
  const path = `/admin/analytics/pages${qs({
    ...paramsFromQuery(query),
    sort,
    page,
    limit: 20,
  })}`;
  const q = useApiQuery<AnalyticsPageRow[]>(path);

  return (
    <Card
      title="Pages"
      action={
        <select value={sort} onChange={(e) => setSort(e.target.value as AnalyticsPagesSort)} className={selectClass}>
          <option value="views">Sort: Views</option>
          <option value="unique">Sort: Unique visitors</option>
          <option value="sessions">Sort: Sessions</option>
          <option value="bounce">Sort: Bounce rate</option>
          <option value="time">Sort: Last seen</option>
        </select>
      }
    >
      <TableWrap
        loading={q.loading}
        error={q.error}
        reload={q.reload}
        empty={!q.data || q.data.length === 0}
        footer={<Pager pagination={q.pagination} onPage={setPage} />}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="py-3 text-left">Page</th>
              <th className="py-3 text-right">Views</th>
              <th className="py-3 text-right">Unique</th>
              <th className="py-3 text-right">Sessions</th>
              <th className="py-3 text-right">Entries</th>
              <th className="py-3 text-right">Exits</th>
              <th className="py-3 text-right">Bounce</th>
              <th className="py-3 text-right">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((r) => (
              <tr key={r.pagePath} className="border-b border-slate-50 last:border-0">
                <td className="py-3">
                  <div className="text-xs font-bold text-slate-900">{r.pageTitle || "Untitled"}</div>
                  <div className="text-[10px] text-slate-400">{r.pagePath}</div>
                </td>
                <td className="py-3 text-right text-xs font-semibold text-slate-700">{num(r.totalViews)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(r.uniqueVisitors)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(r.sessions)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(r.entries)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(r.exits)}</td>
                <td className="py-3 text-right text-xs font-semibold text-slate-700">{pct(r.bounceRate)}</td>
                <td className="py-3 text-right text-xs text-slate-500">{shortDate(r.lastSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  );
}

/* ============================================================
   Section: Clicks
   ============================================================ */

function ClicksSection({ query }: { query: string }) {
  const [pagePath, setPagePath] = useState("");
  const [page, setPage] = useState(1);
  const clicks = useApiQuery<AnalyticsClickRow[]>(
    `/admin/analytics/clicks${qs({ ...paramsFromQuery(query), pagePath: pagePath.trim() || undefined, page, limit: 20 })}`
  );
  const top = useApiQuery<AnalyticsTopElement[]>(
    `/admin/analytics/clicks/top-elements${qs({ ...paramsFromQuery(query), limit: 10 })}`
  );

  return (
    <>
      <Card title="Top clicked elements" action={<span className="text-[11px] font-semibold text-slate-500">Across the whole site</span>}>
        {top.loading && !top.data ? (
          <Spinner label="Loading..." />
        ) : top.error ? (
          <ErrorBox message={top.error} onRetry={top.reload} />
        ) : !top.data || top.data.length === 0 ? (
          <EmptyState title="No click data yet" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top.data} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis dataKey="buttonLabel" type="category" tick={{ fontSize: 10, fill: "#64748b" }} width={120} />
                <Tooltip />
                <Bar dataKey="totalClicks" fill="#ec4899" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card
        title="Click events"
        action={
          <input
            type="text"
            value={pagePath}
            onChange={(e) => {
              setPagePath(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by page path, e.g. /products/foo"
            className={`${inputClass} max-w-sm`}
          />
        }
      >
        <TableWrap
          loading={clicks.loading}
          error={clicks.error}
          reload={clicks.reload}
          empty={!clicks.data || clicks.data.length === 0}
          footer={<Pager pagination={clicks.pagination} onPage={setPage} />}
        >
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="py-3 text-left">Label</th>
                <th className="py-3 text-left">Element id</th>
                <th className="py-3 text-left">Page</th>
                <th className="py-3 text-right">Clicks</th>
                <th className="py-3 text-right">Unique</th>
              </tr>
            </thead>
            <tbody>
              {(clicks.data ?? []).map((r, i) => (
                <tr key={`${r.elementId}-${r.pagePath}-${i}`} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 text-xs font-bold text-slate-900">{r.buttonLabel || "—"}</td>
                  <td className="py-3 font-mono text-[11px] text-slate-600">{r.elementId}</td>
                  <td className="py-3 text-xs text-slate-600">{r.pagePath}</td>
                  <td className="py-3 text-right text-xs font-semibold text-slate-700">{num(r.totalClicks)}</td>
                  <td className="py-3 text-right text-xs text-slate-500">{num(r.uniqueVisitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}

/* ============================================================
   Section: Products
   ============================================================ */

function ProductsSection({ query }: { query: string }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const q = useApiQuery<AnalyticsProductRow[]>(`/admin/analytics/products${qs({ ...paramsFromQuery(query), page, limit: 20 })}`);

  return (
    <Card title="Products — engagement & conversion" action={<span className="text-[11px] font-semibold text-slate-500">Click a row for a deep-dive</span>}>
      <TableWrap
        loading={q.loading}
        error={q.error}
        reload={q.reload}
        empty={!q.data || q.data.length === 0}
        footer={<Pager pagination={q.pagination} onPage={setPage} />}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="py-3 text-left">Product</th>
              <th className="py-3 text-right">Views</th>
              <th className="py-3 text-right">Clicks</th>
              <th className="py-3 text-right">Add-to-cart</th>
              <th className="py-3 text-right">Wishlist</th>
              <th className="py-3 text-right">Purchases</th>
              <th className="py-3 text-right">Revenue</th>
              <th className="py-3 text-right">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((p) => (
              <tr
                key={p.productId}
                onClick={() => setSelected(p.productId)}
                className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 last:border-0"
              >
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    {p.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-slate-900">{p.productTitle}</div>
                      <div className="text-[10px] text-slate-400">{formatBDT(p.price)}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right text-xs font-semibold text-slate-700">{num(p.views)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(p.clicks)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(p.addToCart)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(p.wishlist)}</td>
                <td className="py-3 text-right text-xs font-bold text-emerald-700">{num(p.purchases)}</td>
                <td className="py-3 text-right text-xs font-bold text-slate-900">{formatBDT(p.revenue)}</td>
                <td className="py-3 text-right text-xs font-semibold text-slate-700">{pct(p.conversionRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <ProductDetailModal productId={selected} query={query} onClose={() => setSelected(null)} />
    </Card>
  );
}

function ProductDetailModal({
  productId,
  query,
  onClose,
}: {
  productId: string | null;
  query: string;
  onClose: () => void;
}) {
  const q = useApiQuery<AnalyticsProductDetail>(
    productId ? `/admin/analytics/products/${encodeURIComponent(productId)}${query}` : null
  );
  return (
    <Modal open={!!productId} onClose={onClose} className="max-w-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <h3 className="text-base font-extrabold text-slate-900">Product deep-dive</h3>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100">
          Close
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-5">
        {q.loading ? (
          <Spinner label="Loading product..." />
        ) : q.error ? (
          <ErrorBox message={q.error} onRetry={q.reload} />
        ) : !q.data ? null : (
          <>
            <div className="mb-4 flex items-start gap-4">
              {q.data.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.data.thumbnail} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900">{q.data.productTitle}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{q.data.slug}</div>
                <div className="mt-1 text-xs font-bold text-slate-700">{formatBDT(q.data.price)}</div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {shortDate(q.data.range.from)} → {shortDate(q.data.range.to)}
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <StatTile label="Views" value={num(q.data.views)} tint="bg-blue-50 text-blue-700" />
              <StatTile label="Clicks" value={num(q.data.clicks)} tint="bg-indigo-50 text-indigo-700" />
              <StatTile label="Unique visitors" value={num(q.data.uniqueVisitors)} tint="bg-sky-50 text-sky-700" />
              <StatTile label="Add to cart" value={num(q.data.addToCart)} tint="bg-emerald-50 text-emerald-700" />
              <StatTile label="Remove from cart" value={num(q.data.removeFromCart)} tint="bg-rose-50 text-rose-700" />
              <StatTile label="Wishlist" value={num(q.data.wishlist)} tint="bg-pink-50 text-pink-700" />
              <StatTile label="Purchases" value={num(q.data.purchases)} tint="bg-amber-50 text-amber-700" />
              <StatTile label="Revenue" value={formatBDT(q.data.revenue)} tint="bg-emerald-50 text-emerald-700" />
              <StatTile label="Conversion" value={pct(q.data.conversionRate)} tint="bg-violet-50 text-violet-700" />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
   Section: Visitors & Sessions
   ============================================================ */

function VisitorsSection({ query }: { query: string }) {
  const [view, setView] = useState<"visitors" | "sessions">("visitors");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const visitors = useApiQuery<AnalyticsVisitorRow[]>(
    view === "visitors"
      ? `/admin/analytics/visitors${qs({ search: search.trim() || undefined, page, limit: 20 })}`
      : null
  );
  const sessions = useApiQuery<AnalyticsSessionRow[]>(
    view === "sessions"
      ? `/admin/analytics/sessions${qs({ ...paramsFromQuery(query), active: sessionActive || undefined, page, limit: 20 })}`
      : null
  );

  return (
    <Card
      title={view === "visitors" ? "Visitors" : "Sessions"}
      action={
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(["visitors", "sessions"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setView(v);
                  setPage(1);
                }}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                  view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {v === "visitors" ? "Visitors" : "Sessions"}
              </button>
            ))}
          </div>
          {view === "visitors" && (
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search visitorId"
              className={`${inputClass} max-w-xs`}
            />
          )}
          {view === "sessions" && (
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={sessionActive}
                onChange={(e) => {
                  setSessionActive(e.target.checked);
                  setPage(1);
                }}
              />
              Live only
            </label>
          )}
        </div>
      }
    >
      {view === "visitors" ? (
        <TableWrap
          loading={visitors.loading}
          error={visitors.error}
          reload={visitors.reload}
          empty={!visitors.data || visitors.data.length === 0}
          footer={<Pager pagination={visitors.pagination} onPage={setPage} />}
        >
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="py-3 text-left">Visitor</th>
                <th className="py-3 text-left">First / last visit</th>
                <th className="py-3 text-right">Sessions</th>
                <th className="py-3 text-right">Page views</th>
                <th className="py-3 text-left">Source</th>
                <th className="py-3 text-left">Device</th>
                <th className="py-3 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {(visitors.data ?? []).map((v) => (
                <tr key={v.visitorId} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 font-mono text-[11px] text-slate-700">{v.visitorId.slice(0, 20)}…</td>
                  <td className="py-3 text-[11px] text-slate-600">
                    <div>{shortDate(v.firstVisit)}</div>
                    <div className="text-slate-400">{shortDate(v.lastVisit)}</div>
                  </td>
                  <td className="py-3 text-right text-xs font-semibold text-slate-700">{num(v.totalSessions)}</td>
                  <td className="py-3 text-right text-xs text-slate-600">{num(v.totalPageViews)}</td>
                  <td className="py-3 text-xs text-slate-600">{v.firstTrafficSource ?? "—"}</td>
                  <td className="py-3 text-xs text-slate-600">
                    {v.deviceType}
                    {v.browser ? ` · ${v.browser}` : ""}
                  </td>
                  <td className="py-3 text-xs text-slate-600">
                    {v.city ? `${v.city}, ${v.country ?? ""}` : v.country ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <TableWrap
          loading={sessions.loading}
          error={sessions.error}
          reload={sessions.reload}
          empty={!sessions.data || sessions.data.length === 0}
          footer={<Pager pagination={sessions.pagination} onPage={setPage} />}
        >
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="py-3 text-left">Session</th>
                <th className="py-3 text-left">Entry → exit</th>
                <th className="py-3 text-right">Page views</th>
                <th className="py-3 text-right">Events</th>
                <th className="py-3 text-right">Duration</th>
                <th className="py-3 text-left">Source · Device</th>
                <th className="py-3 text-left">State</th>
              </tr>
            </thead>
            <tbody>
              {(sessions.data ?? []).map((s) => (
                <tr key={s.sessionId} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 font-mono text-[11px] text-slate-700">{s.sessionId.slice(0, 16)}…</td>
                  <td className="py-3 text-[11px] text-slate-600">
                    <div className="truncate">{s.entryPage}</div>
                    <div className="truncate text-slate-400">{s.exitPage || s.currentPage || "—"}</div>
                  </td>
                  <td className="py-3 text-right text-xs font-semibold text-slate-700">{num(s.pageViews)}</td>
                  <td className="py-3 text-right text-xs text-slate-600">{num(s.totalEvents)}</td>
                  <td className="py-3 text-right text-xs text-slate-600">{secondsLabel(s.duration)}</td>
                  <td className="py-3 text-xs text-slate-600">
                    {(s.trafficSource ?? "—") + " · " + s.deviceType}
                  </td>
                  <td className="py-3 text-[10px]">
                    <span
                      className={`inline-block rounded-lg border px-2 py-0.5 font-extrabold uppercase ${
                        s.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : s.isBounce
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.isActive ? "LIVE" : s.isBounce ? "BOUNCE" : "ENDED"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </Card>
  );
}

/* ============================================================
   Section: Customer Journey
   ============================================================ */

function JourneySection({ query }: { query: string }) {
  const q = useApiQuery<AnalyticsJourney[]>(`/admin/analytics/journeys${qs({ ...paramsFromQuery(query), limit: 20 })}`);
  if (q.loading && !q.data) return <Spinner label="Loading journeys..." />;
  if (q.error) return <ErrorBox message={q.error} onRetry={q.reload} />;
  const rows = q.data ?? [];
  if (rows.length === 0) return <EmptyState title="No journey data yet" />;
  const maxSessions = Math.max(...rows.map((r) => r.sessions), 1);

  return (
    <Card title="Most common session paths" action={<span className="text-[11px] font-semibold text-slate-500">First 5 pages per session</span>}>
      <ol className="space-y-3">
        {rows.map((j, i) => (
          <li key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                {j.path.map((p, idx) => (
                  <span key={idx} className="inline-flex items-center">
                    <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800 shadow-sm">{p}</span>
                    {idx < j.path.length - 1 && <span className="mx-1 text-slate-400">→</span>}
                  </span>
                ))}
              </div>
              <span className="shrink-0 text-xs font-extrabold text-slate-900">{num(j.sessions)} sessions</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-blue-600" style={{ width: `${(j.sessions / maxSessions) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ============================================================
   Section: Conversion Funnel
   ============================================================ */

function FunnelSection({ query }: { query: string }) {
  const q = useApiQuery<AnalyticsFunnel>(`/admin/analytics/funnel${query}`);
  if (q.loading && !q.data) return <Spinner label="Loading funnel..." />;
  if (q.error) return <ErrorBox message={q.error} onRetry={q.reload} />;
  const d = q.data;
  if (!d || d.stages.length === 0) return <EmptyState title="No funnel data yet" />;
  const first = d.stages[0]?.count || 1;

  return (
    <Card
      title="Conversion funnel"
      action={<span className="text-[11px] font-semibold text-slate-500">{shortDate(d.range.from)} → {shortDate(d.range.to)}</span>}
    >
      <ol className="flex flex-col gap-2">
        {d.stages.map((s, i) => {
          const width = (s.count / first) * 100;
          return (
            <li key={s.stage} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent" style={{ width: `${width}%` }} />
              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 capitalize">
                    {s.stage.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-slate-900">{num(s.count)}</span>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                    {pct(s.conversionFromStart, 1)} of start
                  </span>
                  {s.dropOff > 0 && (
                    <span className="rounded-lg bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
                      − {pct(s.dropOff, 1)} drop-off
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ============================================================
   Section: Cart & Checkout
   ============================================================ */

function CartSection({ query }: { query: string }) {
  const cart = useApiQuery<AnalyticsCart>(`/admin/analytics/cart${query}`);
  const checkout = useApiQuery<AnalyticsCheckout>(`/admin/analytics/checkout${query}`);

  if (cart.loading && !cart.data) return <Spinner label="Loading cart analytics..." />;
  if (cart.error) return <ErrorBox message={cart.error} onRetry={cart.reload} />;
  const c = cart.data;
  const k = checkout.data;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Cart adds" value={num(c?.added)} tint="bg-emerald-50 text-emerald-700" icon={<ShoppingCart className="h-4 w-4" />} />
        <StatTile label="Cart removes" value={num(c?.removed)} tint="bg-rose-50 text-rose-700" icon={<ShoppingCart className="h-4 w-4" />} />
        <StatTile label="Checkout starts" value={num(c?.checkoutStart)} tint="bg-sky-50 text-sky-700" icon={<ShoppingBag className="h-4 w-4" />} />
        <StatTile label="Abandonment rate" value={pct(c?.abandonmentRate)} tint="bg-amber-50 text-amber-700" icon={<ShoppingBag className="h-4 w-4" />} />
      </div>

      <Card title="Checkout funnel">
        {checkout.loading && !checkout.data ? (
          <Spinner label="Loading..." />
        ) : checkout.error ? (
          <ErrorBox message={checkout.error} onRetry={checkout.reload} />
        ) : !k ? (
          <EmptyState title="No checkout data yet" />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatTile label="Checkout start" value={num(k.checkoutStart)} tint="bg-blue-50 text-blue-700" />
              <StatTile label="Payment initiated" value={num(k.paymentInitiated)} tint="bg-indigo-50 text-indigo-700" />
              <StatTile label="Payment success (client)" value={num(k.paymentSuccessClient)} tint="bg-emerald-50 text-emerald-700" />
              <StatTile label="Payment failed" value={num(k.paymentFailed)} tint="bg-rose-50 text-rose-700" />
              <StatTile label="Verified orders" value={num(k.verifiedOrders)} sub="From Orders collection" tint="bg-amber-50 text-amber-700" />
            </div>
            {k.paymentMethodMix.length > 0 && (
              <div className="mt-5">
                <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Payment method mix</h4>
                <div className="flex flex-wrap gap-2">
                  {k.paymentMethodMix.map((m) => (
                    <span key={m.paymentMethod} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs">
                      <span className="font-bold text-slate-900">{m.paymentMethod}</span>
                      <span className="font-semibold text-slate-600">{num(m.orders)} orders</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {c && c.topAddedProducts.length > 0 && (
        <Card title="Top added products">
          <ul className="grid gap-2 sm:grid-cols-2">
            {c.topAddedProducts.map((p) => (
              <li key={p._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <code className="text-[11px] text-slate-700">{p._id}</code>
                <span className="text-xs font-bold text-slate-900">{num(p.additions)} added</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

/* ============================================================
   Section: Customer Analytics
   ============================================================ */

function CustomersSection({ query }: { query: string }) {
  const [page, setPage] = useState(1);
  const q = useApiQuery<AnalyticsCustomer[]>(`/admin/analytics/customers${qs({ ...paramsFromQuery(query), page, limit: 20 })}`);

  return (
    <Card title="Identified customers" action={<span className="text-[11px] font-semibold text-slate-500">Events where userId was set</span>}>
      <TableWrap
        loading={q.loading}
        error={q.error}
        reload={q.reload}
        empty={!q.data || q.data.length === 0}
        footer={<Pager pagination={q.pagination} onPage={setPage} />}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="py-3 text-left">User</th>
              <th className="py-3 text-right">Events</th>
              <th className="py-3 text-right">Page views</th>
              <th className="py-3 text-right">Add-to-cart</th>
              <th className="py-3 text-right">Checkout starts</th>
              <th className="py-3 text-right">Sessions</th>
              <th className="py-3 text-right">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((c) => (
              <tr key={c.userId} className="border-b border-slate-50 last:border-0">
                <td className="py-3 font-mono text-[11px] text-slate-700">{c.userId}</td>
                <td className="py-3 text-right text-xs font-semibold text-slate-700">{num(c.totalEvents)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(c.pageViews)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(c.addToCart)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(c.checkoutStart)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(c.sessions)}</td>
                <td className="py-3 text-right text-xs text-slate-500">{shortDateTime(c.lastSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  );
}

/* ============================================================
   Section: Searches
   ============================================================ */

function SearchesSection({ query }: { query: string }) {
  const [page, setPage] = useState(1);
  const q = useApiQuery<AnalyticsSearch[]>(`/admin/analytics/searches${qs({ ...paramsFromQuery(query), page, limit: 20 })}`);

  return (
    <Card title="Search queries" action={<span className="text-[11px] font-semibold text-slate-500">From storefront search events</span>}>
      <TableWrap
        loading={q.loading}
        error={q.error}
        reload={q.reload}
        empty={!q.data || q.data.length === 0}
        footer={<Pager pagination={q.pagination} onPage={setPage} />}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <th className="py-3 text-left">Query</th>
              <th className="py-3 text-right">Searches</th>
              <th className="py-3 text-right">No-result</th>
              <th className="py-3 text-right">Unique visitors</th>
              <th className="py-3 text-right">No-result rate</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((r) => (
              <tr key={r.query} className="border-b border-slate-50 last:border-0">
                <td className="py-3 text-xs font-bold text-slate-900">{r.query}</td>
                <td className="py-3 text-right text-xs font-semibold text-slate-700">{num(r.count)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(r.noResultCount)}</td>
                <td className="py-3 text-right text-xs text-slate-600">{num(r.uniqueVisitors)}</td>
                <td className="py-3 text-right text-xs font-semibold text-slate-700">
                  {r.count > 0 ? pct((r.noResultCount / r.count) * 100, 1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  );
}

/* ============================================================
   Section: Devices & Locations
   ============================================================ */

function DevicesSection({ query }: { query: string }) {
  const devices = useApiQuery<AnalyticsDevices>(`/admin/analytics/devices${query}`);
  const locations = useApiQuery<AnalyticsLocation[]>(`/admin/analytics/locations${query}`);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="By device">
          <BarList rows={(devices.data?.byDevice ?? []).map((r) => ({ label: r.deviceType, value: r.sessions }))} empty="No device data" />
        </Card>
        <Card title="By browser">
          <BarList rows={(devices.data?.byBrowser ?? []).map((r) => ({ label: r.browser, value: r.sessions }))} empty="No browser data" />
        </Card>
        <Card title="By operating system">
          <BarList rows={(devices.data?.byOs ?? []).map((r) => ({ label: r.operatingSystem, value: r.sessions }))} empty="No OS data" />
        </Card>
      </div>

      <Card title="Locations" action={<span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Country · City</span>}>
        {locations.loading && !locations.data ? (
          <Spinner label="Loading locations..." />
        ) : locations.error ? (
          <ErrorBox message={locations.error} onRetry={locations.reload} />
        ) : !locations.data || locations.data.length === 0 ? (
          <EmptyState title="No location data yet" />
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  <th className="px-5 py-3 text-left sm:px-6">Country</th>
                  <th className="px-3 py-3 text-left">City</th>
                  <th className="px-3 py-3 text-right">Sessions</th>
                  <th className="px-3 py-3 text-right">Unique visitors</th>
                </tr>
              </thead>
              <tbody>
                {locations.data.map((l, i) => (
                  <tr key={`${l.country}-${l.city}-${i}`} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 text-xs font-bold text-slate-900 sm:px-6">{l.country || "—"}</td>
                    <td className="px-3 py-3 text-xs text-slate-700">{l.city || "—"}</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-slate-700">{num(l.sessions)}</td>
                    <td className="px-3 py-3 text-right text-xs text-slate-600">{num(l.uniqueVisitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function BarList({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2">
      {rows.slice(0, 8).map((r) => (
        <li key={r.label} className="text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{r.label || "—"}</span>
            <span className="font-semibold text-slate-600">{num(r.value)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-blue-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

/** Parse a `?foo=bar&...` string back into a plain object so we can merge more params. */
function paramsFromQuery(query: string): Record<string, string | undefined> {
  if (!query) return {};
  const clean = query.startsWith("?") ? query.slice(1) : query;
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(clean).entries()) out[k] = v;
  return out;
}
