"use client";

import { useMemo, useState } from "react";
import { CirclePlus, Pencil, Receipt, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Expense, ExpenseType, ExpensesSummary } from "@/lib/backend-types";
import { EXPENSE_TYPE_LABELS, EXPENSE_TYPES } from "@/lib/backend-types";
import { qs, useApiAction, useApiQuery, type Pagination } from "../api";
import { formatBDT, formatShortDate } from "../format";
import {
  Drawer,
  EmptyState,
  ErrorBox,
  FieldError,
  PageHeader,
  Pager,
  PrimaryButton,
  SearchBox,
  Spinner,
  inputClass,
  labelClass,
  selectClass,
  useConfirm,
  useDebounced,
} from "../ui";

type ListResponse = { items: Expense[]; pagination: Pagination };

const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

const monthStartIso = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return toDateInput(d.toISOString());
};
const todayIso = () => toDateInput(new Date().toISOString());

export default function ExpensesPage() {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const action = useApiAction();

  const [type, setType] = useState<ExpenseType | "">("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(monthStartIso());
  const [toDate, setToDate] = useState(todayIso());
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Expense | "new" | null>(null);

  const q = useDebounced(search);
  const canCreate = hasPermission("expenses.create");
  const canUpdate = hasPermission("expenses.update");
  const canDelete = hasPermission("expenses.delete");

  const expenses = useApiQuery<ListResponse>(
    `/admin/expenses${qs({ type, fromDate, toDate, page, limit: 20 })}`
  );
  // Summary spans the same date window so the tiles stay in sync.
  const summary = useApiQuery<ExpensesSummary>(
    `/admin/expenses/summary${qs({ fromDate, toDate })}`
  );

  // Client-side text filter — backend doesn't take a search param. Lightweight because page size is 20.
  const items = useMemo(() => {
    const list = expenses.data?.items ?? [];
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (e) =>
        e.description?.toLowerCase().includes(needle) ||
        (e.paidVia || "").toLowerCase().includes(needle) ||
        EXPENSE_TYPE_LABELS[e.type].toLowerCase().includes(needle)
    );
  }, [expenses.data, q]);

  const removeOne = async (e: Expense) => {
    const ok = await confirm({
      title: "Delete expense?",
      text: `Remove ${formatBDT(e.amount)} for "${e.description || EXPENSE_TYPE_LABELS[e.type]}"? This stops it from contributing to P&L for every period.`,
      confirmText: "Yes, Delete",
    });
    if (!ok) return;
    const res = await action(`/admin/expenses/${e._id}`, { method: "DELETE" }, "Expense deleted");
    if (res) {
      expenses.reload();
      summary.reload();
    }
  };

  const onSaved = () => {
    setEditing(null);
    expenses.reload();
    summary.reload();
  };

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Expenses"
        subtitle="Operating costs the business pays — ads, delivery, salary, rent, damage, packaging. Everything here feeds Profit & Loss."
      >
        {canCreate && (
          <PrimaryButton onClick={() => setEditing("new")}>
            <CirclePlus className="mr-2 h-4 w-4" /> Record Expense
          </PrimaryButton>
        )}
      </PageHeader>

      <SummaryTiles summary={summary.data} loading={summary.loading && !summary.data} />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <SearchBox value={search} onChange={setSearch} placeholder="Search description, paid via..." />
        <select
          className={selectClass}
          value={type}
          onChange={(e) => resetPage(setType)(e.target.value as ExpenseType | "")}
        >
          <option value="">All types</option>
          {EXPENSE_TYPES.map((t) => (
            <option key={t} value={t}>
              {EXPENSE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          From
          <input type="date" className={selectClass} value={fromDate} onChange={(e) => resetPage(setFromDate)(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          To
          <input type="date" className={selectClass} value={toDate} onChange={(e) => resetPage(setToDate)(e.target.value)} />
        </label>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {expenses.loading && !expenses.data ? (
          <Spinner label="Loading expenses..." />
        ) : expenses.error ? (
          <ErrorBox message={expenses.error} onRetry={expenses.reload} />
        ) : !items.length ? (
          <EmptyState title="No expenses in this range" text="Record one with the button above, or widen the date range." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Paid via</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((e) => (
                  <tr key={e._id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-3 whitespace-nowrap text-slate-500">{formatShortDate(e.expenseDate)}</td>
                    <td className="px-4 py-3">
                      <TypeBadge value={e.type} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{e.description || <span className="italic text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{e.paidVia || "—"}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">{formatBDT(e.amount)}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => setEditing(e)}
                            title="Edit expense"
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => removeOne(e)}
                            title="Delete expense"
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
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
        <Pager pagination={expenses.data?.pagination ?? null} onPage={setPage} />
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <ExpenseForm
            key={editing === "new" ? "new" : editing._id}
            expense={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={onSaved}
          />
        )}
      </Drawer>
    </div>
  );
}

function SummaryTiles({ summary, loading }: { summary: ExpensesSummary | null; loading: boolean }) {
  const topTypes = useMemo(() => {
    if (!summary) return [];
    return [...summary.byType].sort((a, b) => b.amount - a.amount).slice(0, 3);
  }, [summary]);

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile label="Total" value={summary ? formatBDT(summary.total) : loading ? "…" : "—"} tone="bg-slate-900 text-white" />
      <Tile label="Entries" value={summary ? String(summary.count) : loading ? "…" : "—"} tone="bg-blue-50 text-blue-700" />
      {topTypes.map((t) => (
        <Tile
          key={t.type}
          label={EXPENSE_TYPE_LABELS[t.type]}
          value={formatBDT(t.amount)}
          hint={`${t.count} entr${t.count === 1 ? "y" : "ies"}`}
          tone="bg-amber-50 text-amber-700"
        />
      ))}
    </section>
  );
}

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}>
          <Receipt className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-xl font-extrabold text-slate-900">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{hint}</div>}
    </div>
  );
}

const TYPE_TONE: Record<ExpenseType, string> = {
  AD_COST: "bg-sky-50 text-sky-700 border-sky-200",
  DELIVERY_COST: "bg-amber-50 text-amber-700 border-amber-200",
  DAMAGE_COST: "bg-rose-50 text-rose-700 border-rose-200",
  SALARY: "bg-indigo-50 text-indigo-700 border-indigo-200",
  RENT: "bg-violet-50 text-violet-700 border-violet-200",
  UTILITY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PACKAGING: "bg-cyan-50 text-cyan-700 border-cyan-200",
  COMMISSION: "bg-pink-50 text-pink-700 border-pink-200",
  OTHER: "bg-slate-100 text-slate-700 border-slate-200",
};

function TypeBadge({ value }: { value: ExpenseType }) {
  return (
    <span className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap uppercase ${TYPE_TONE[value]}`}>
      {EXPENSE_TYPE_LABELS[value]}
    </span>
  );
}

function ExpenseForm({ expense, onClose, onSaved }: { expense: Expense | null; onClose: () => void; onSaved: () => void }) {
  const action = useApiAction();
  const [form, setForm] = useState({
    type: expense?.type ?? ("OTHER" as ExpenseType),
    amount: expense ? String(expense.amount) : "",
    description: expense?.description ?? "",
    expenseDate: toDateInput(expense?.expenseDate) || todayIso(),
    paidVia: expense?.paidVia ?? "",
    orderId: typeof expense?.orderId === "string" ? expense.orderId : expense?.orderId?._id ?? "",
    productId: typeof expense?.productId === "string" ? expense.productId : expense?.productId?._id ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return setError("Amount must be a positive number.");
    if (!form.description.trim()) return setError("Add a short description.");
    setError("");
    setSaving(true);

    const body: Record<string, unknown> = {
      type: form.type,
      amount,
      description: form.description.trim(),
      expenseDate: new Date(`${form.expenseDate}T00:00:00Z`).toISOString(),
      paidVia: form.paidVia.trim() || null,
      orderId: form.orderId.trim() || null,
      productId: form.productId.trim() || null,
    };

    const res = expense
      ? await action(`/admin/expenses/${expense._id}`, { method: "PUT", json: body }, "Expense updated")
      : await action("/admin/expenses", { method: "POST", json: body }, "Expense recorded");
    setSaving(false);
    if (res) onSaved();
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">{expense ? "Edit expense" : "Record expense"}</h2>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Type *</span>
          <select className={inputClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ExpenseType }))}>
            {EXPENSE_TYPES.map((t) => (
              <option key={t} value={t}>
                {EXPENSE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Amount (৳) *</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Expense date *</span>
            <input
              type="date"
              className={inputClass}
              value={form.expenseDate}
              onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Description *</span>
          <input
            className={inputClass}
            placeholder="e.g. Facebook ad for Autumn collection"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Paid via (optional)</span>
          <input
            className={inputClass}
            placeholder="e.g. bKash, Bank, Cash"
            value={form.paidVia}
            onChange={(e) => setForm((f) => ({ ...f, paidVia: e.target.value }))}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Link to order (optional)</span>
            <input
              className={inputClass}
              placeholder="Order ID"
              value={form.orderId}
              onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
            />
            <span className="text-[11px] text-slate-400">Links this cost to one order so the per-order profit view can subtract it.</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Link to product (optional)</span>
            <input
              className={inputClass}
              placeholder="Product ID"
              value={form.productId}
              onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
            />
          </label>
        </div>

        <FieldError message={error} />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
        <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          Cancel
        </button>
        <PrimaryButton type="submit" loading={saving}>
          {expense ? "Save Changes" : "Record Expense"}
        </PrimaryButton>
      </div>
    </form>
  );
}

