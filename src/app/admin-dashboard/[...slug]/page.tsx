import Link from "next/link";
import { Construction } from "lucide-react";

// Fallback for sidebar sections the backend lists in the menu but that have no page yet.
export default async function AdminSectionPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const title = slug
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" / ");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-2xs">
      <Construction className="h-10 w-10 text-amber-500" />
      <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
      <p className="max-w-sm text-sm text-slate-500">The backend does not provide an API for this section yet. It will be connected once the endpoints exist.</p>
      <Link href="/admin-dashboard" className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        Back to Dashboard
      </Link>
    </div>
  );
}
