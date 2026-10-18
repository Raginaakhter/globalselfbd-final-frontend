// Shown by Next.js the moment any (store) route starts navigating, until its server component resolves.
// Keeps the header/footer visible (they're in the layout) and swaps the main content for a skeleton
// so the user sees instant feedback instead of a frozen previous page.
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
      {/* Breadcrumb placeholder */}
      <div className="h-3 w-48 rounded-full bg-slate-200 animate-pulse mb-4" />

      {/* Hero / banner placeholder */}
      <div className="h-32 sm:h-40 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse mb-8" />

      {/* Toolbar placeholder */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="h-10 w-full sm:max-w-md rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse ml-auto" />
      </div>

      {/* Product grid placeholder */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
            <div className="w-full aspect-square rounded-xl bg-slate-200 animate-pulse mb-3" />
            <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse mb-2" />
            <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse mb-1.5" />
            <div className="h-4 w-3/4 rounded-full bg-slate-200 animate-pulse mb-3" />
            <div className="h-5 w-20 rounded-full bg-slate-200 animate-pulse mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-9 rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-9 rounded-xl bg-slate-900/20 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
