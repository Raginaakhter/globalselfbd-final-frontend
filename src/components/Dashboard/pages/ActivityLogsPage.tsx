"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ACTIVITY_ACTIONS, type ActivityLog } from "@/lib/backend-types";
import { BASE } from "../AppSidebar";
import { qs, useApiQuery } from "../api";
import { EmptyState, ErrorBox, PageHeader, Pager, Spinner, selectClass } from "../ui";
import { formatDateTime } from "./orderShared";

const actionLabel = (a: string) => a.charAt(0) + a.slice(1).toLowerCase().replace(/_/g, " ");

const ACTION_TONE = (a: string) =>
  /DELETED|REMOVED|CANCELLED/.test(a)
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : /CREATED|ASSIGNED|DELIVERED/.test(a)
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : /PAYMENT/.test(a)
        ? "bg-violet-50 text-violet-700 border-violet-200"
        : "bg-sky-50 text-sky-700 border-sky-200";

/** One value in a change summary: long lists show as a count. */
const short = (v: unknown): string => {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? "" : "s"}`;
  if (typeof v === "object") return "{…}";
  return String(v);
};

/** "status: ACTIVE → INACTIVE" lines built from the old and new values. */
function changeLines(oldValue: unknown, newValue: unknown) {
  const o = (oldValue && typeof oldValue === "object" ? oldValue : {}) as Record<string, unknown>;
  const n = (newValue && typeof newValue === "object" ? newValue : {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(o), ...Object.keys(n)])];
  return keys.map((k) => ({ key: k, from: k in o ? short(o[k]) : null, to: k in n ? short(n[k]) : null }));
}

function Target({ log }: { log: ActivityLog }) {
  const parts: React.ReactNode[] = [];
  if (log.targetOrderId)
    parts.push(
      <Link key="o" href={`${BASE}/orders/${log.targetOrderId._id}`} className="font-mono font-bold text-blue-600 hover:underline">
        {log.targetOrderId.orderNumber}
      </Link>
    );
  if (log.targetUserId) parts.push(<span key="u">{log.targetUserId.fullName}</span>);
  if (log.targetRoleId) parts.push(<span key="r">Role: {log.targetRoleId.name}</span>);
  if (!parts.length) {
    // The target was deleted: fall back to the name kept in the old value.
    const old = (log.oldValue ?? {}) as Record<string, unknown>;
    const name = old.fullName ?? old.name ?? old.email;
    return <span className="text-slate-400">{name ? `${String(name)} (deleted)` : "—"}</span>;
  }
  return <div className="flex flex-col gap-0.5">{parts}</div>;
}

/** Audit trail of admin actions (GET /activity-logs, permission activityLogs.view). */
export default function ActivityLogsPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const logs = useApiQuery<ActivityLog[]>(`/activity-logs${qs({ action, page, limit: 30 })}`);

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title="Activity Logs" subtitle="Who changed what and when: roles, users, permissions, orders and payments. Newest first." />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <select
          className={selectClass}
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All actions</option>
          {ACTIVITY_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {actionLabel(a)}
            </option>
          ))}
        </select>
        {logs.pagination && <span className="text-xs text-slate-500">{logs.pagination.total} entries</span>}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        {logs.loading && !logs.data ? (
          <Spinner label="Loading activity..." />
        ) : logs.error ? (
          <ErrorBox message={logs.error} onRetry={logs.reload} />
        ) : !logs.data?.length ? (
          <EmptyState title="No activity found" text={action ? "Nothing logged for this action yet." : "Changes made in the dashboard appear here."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  <th className="px-6 py-3.5">When</th>
                  <th className="px-4 py-3.5">Who</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Change</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.data.map((log) => {
                  const lines = changeLines(log.oldValue, log.newValue);
                  const expanded = open === log._id;
                  return (
                    <Fragment key={log._id}>
                      <tr className="align-top transition hover:bg-slate-50/60">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatDateTime(log.createdAt)}</td>
                        <td className="px-4 py-4">
                          {log.actorUserId ? (
                            <>
                              <div className="font-semibold text-slate-800">{log.actorUserId.fullName}</div>
                              <div className="text-slate-400">{log.actorUserId.email}</div>
                            </>
                          ) : (
                            <span className="text-slate-400">System / customer</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block rounded-lg border px-2 py-1 text-[10px] font-extrabold whitespace-nowrap ${ACTION_TONE(log.action)}`}>{actionLabel(log.action)}</span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          <Target log={log} />
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {lines.length ? (
                            <ul className="space-y-0.5">
                              {lines.slice(0, 3).map((l) => (
                                <li key={l.key}>
                                  <span className="font-semibold text-slate-500">{l.key}:</span> {l.from !== null && <span className="text-slate-400 line-through decoration-slate-300">{l.from}</span>}
                                  {l.from !== null && l.to !== null && " → "}
                                  {l.to !== null && <span className="font-semibold text-slate-800">{l.to}</span>}
                                </li>
                              ))}
                              {lines.length > 3 && <li className="text-slate-400">+{lines.length - 3} more</li>}
                            </ul>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setOpen(expanded ? null : log._id)}
                            title={expanded ? "Hide details" : "Show details"}
                            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={6} className="px-6 pb-4">
                            <div className="grid gap-3 md:grid-cols-2">
                              {(["oldValue", "newValue"] as const).map((k) => (
                                <div key={k}>
                                  <p className="mb-1 text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">{k === "oldValue" ? "Before" : "After"}</p>
                                  <pre className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700">
                                    {log[k] == null ? "—" : JSON.stringify(log[k], null, 2)}
                                  </pre>
                                </div>
                              ))}
                            </div>
                            {(log.ip || log.userAgent) && (
                              <p className="mt-2 text-[11px] text-slate-400">
                                IP {log.ip ?? "—"} · {log.userAgent ?? ""}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={logs.pagination} onPage={setPage} />
      </div>
    </div>
  );
}
