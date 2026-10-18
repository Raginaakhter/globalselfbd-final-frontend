// Product detail skeleton — shown while fetchProduct + fetchSite resolve server-side.
// Matches the real layout (gallery left, info right) so the swap-in doesn't shift the page.
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
      <div className="h-3 w-56 rounded-full bg-slate-200 animate-pulse mb-4" />

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-8">
        <div className="w-full aspect-square rounded-2xl bg-slate-200 animate-pulse" />

        <div className="flex flex-col gap-3">
          <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-7 w-full rounded-full bg-slate-200 animate-pulse" />
          <div className="h-7 w-3/4 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-4 w-32 rounded-full bg-slate-200 animate-pulse mt-2" />
          <div className="h-10 w-40 rounded-full bg-slate-200 animate-pulse mt-4" />
          <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse mt-4" />
          <div className="h-4 w-5/6 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-4 w-2/3 rounded-full bg-slate-200 animate-pulse" />
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <div className="h-12 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-12 rounded-full bg-slate-900/20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
