// Shown by Next.js the moment any admin-dashboard route starts navigating, until its page resolves.
// The sidebar is in the layout and stays mounted — only this main area is swapped for the skeleton.
export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-56 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-3 w-80 rounded-full bg-slate-200 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="h-9 w-60 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-9 w-32 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-9 w-32 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50/50 p-3.5">
          <div className="h-3 w-full rounded-full bg-slate-200 animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-xl bg-slate-200 animate-pulse" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 w-1/3 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-3 w-1/5 rounded-full bg-slate-200 animate-pulse" />
              </div>
              <div className="h-6 w-20 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-6 w-8 rounded-lg bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
