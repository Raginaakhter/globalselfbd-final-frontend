"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleQuestionMark, Loader2 } from "lucide-react";

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  children,
  className = "max-w-md",
  overlayClassName = "bg-slate-900/60 backdrop-blur-xs",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="admin-dashboard fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className={`fixed inset-0 ${overlayClassName}`} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`admin-pop-in relative w-full overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ---------- Side drawer ---------- */

export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="admin-dashboard">
      <div className="fixed inset-0 z-50 cursor-pointer bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />
      <aside className="admin-slide-in fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl">
        {children}
      </aside>
    </div>,
    document.body
  );
}

/* ---------- Confirm dialog (SweetAlert-style) ---------- */

interface ConfirmOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "primary";
  icon?: "warning" | "question";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(null);

  const confirm = useCallback<ConfirmFn>(
    (o) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOpts(o);
      }),
    []
  );

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  };

  const Icon = opts?.icon === "question" ? CircleQuestionMark : CircleAlert;

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onClose={() => close(false)} className="max-w-sm rounded-2xl">
        {opts && (
          <div className="flex flex-col items-center gap-3 p-7 text-center">
            <Icon className={`h-16 w-16 stroke-[1.25] ${opts.icon === "question" ? "text-sky-400" : "text-amber-400"}`} />
            <h2 className="text-xl font-extrabold text-slate-800">{opts.title}</h2>
            {opts.text && <p className="text-sm text-slate-500">{opts.text}</p>}
            <div className="mt-3 flex items-center gap-2">
              <button
                autoFocus
                onClick={() => close(true)}
                className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 ${
                  opts.tone === "primary" ? "bg-blue-600" : "bg-[#e11d48]"
                }`}
              >
                {opts.confirmText ?? "Yes, Confirm"}
              </button>
              <button
                onClick={() => close(false)}
                className="cursor-pointer rounded-lg bg-[#64748b] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
              >
                {opts.cancelText ?? "Cancel"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

/* ---------- Toggle switch ---------- */

export function Toggle({
  checked,
  onChange,
  color = "peer-checked:bg-blue-800",
  size = "sm",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
  size?: "sm" | "md";
}) {
  const md = size === "md";
  return (
    <label className={`relative inline-block shrink-0 cursor-pointer select-none ${md ? "h-6 w-11" : "h-5 w-10"}`}>
      <input type="checkbox" className="peer h-0 w-0 opacity-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`absolute inset-0 rounded-full bg-slate-300 transition-colors duration-200 ${color}`} />
      <span
        className={`absolute top-1 left-1 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5 ${
          md ? "h-4 w-4" : "h-3 w-3"
        }`}
      />
    </label>
  );
}

/* ---------- Buttons & loaders ---------- */

export function PrimaryButton({
  className = "",
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-blue-800 bg-blue-800 px-5 text-sm font-bold whitespace-nowrap text-white shadow-md transition hover:shadow-lg hover:brightness-95 active:scale-98 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-center text-xs text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-800 border-t-transparent" />
      {label}
    </div>
  );
}

export const inputClass =
  "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition";

export const labelClass = "text-xs font-bold text-slate-700";

export function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-xs font-semibold text-rose-500">{message}</span> : null;
}

/* ---------- Page scaffolding shared by the backend-driven pages ---------- */

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
      <svg className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
      />
    </div>
  );
}

export const selectClass =
  "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none";

export function Pager({
  pagination,
  onPage,
}: {
  pagination: { page: number; totalPages: number; total: number } | null;
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  const btn = "cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
      <span>
        Page <b>{page}</b> of <b>{totalPages}</b> · {total} total
      </span>
      <div className="flex gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 p-12 text-center">
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {text && <p className="max-w-sm text-xs text-slate-400">{text}</p>}
      {children}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-10 text-center">
      <CircleAlert className="h-10 w-10 text-rose-400" />
      <p className="text-sm font-semibold text-rose-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="cursor-pointer rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
          Retry
        </button>
      )}
    </div>
  );
}

const PILL_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
  IN_STOCK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OUT_OF_STOCK: "bg-rose-50 text-rose-700 border-rose-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-sky-50 text-sky-700 border-sky-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  READY_TO_SHIP: "bg-cyan-50 text-cyan-700 border-cyan-200",
  SHIPPED: "bg-violet-50 text-violet-700 border-violet-200",
  OUT_FOR_DELIVERY: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  PRE_ORDER: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  SENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUBSCRIBED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UNSUBSCRIBED: "bg-slate-100 text-slate-600 border-slate-200",
  NEW: "bg-sky-50 text-sky-700 border-sky-200",
  READ: "bg-slate-100 text-slate-600 border-slate-200",
  REPLIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SCHEDULED: "bg-sky-50 text-sky-700 border-sky-200",
  ENDED: "bg-slate-100 text-slate-600 border-slate-200",
  LIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EXPIRED: "bg-rose-50 text-rose-700 border-rose-200",
  USED_UP: "bg-orange-50 text-orange-700 border-orange-200",
};

export function StatusPill({ value }: { value: string }) {
  return (
    <span className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap uppercase ${PILL_STYLES[value] ?? PILL_STYLES.INACTIVE}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

/** Value that only updates after `delay` ms without changes (for search boxes). */
export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
