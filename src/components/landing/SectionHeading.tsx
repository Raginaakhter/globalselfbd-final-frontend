import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  title: string;
  bn?: string;
  href?: string;
  linkLabel?: string;
};

export default function SectionHeading({ title, bn, href = "/shop", linkLabel = "View all" }: Props) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-navy-700 tracking-tight flex items-center gap-3">
          <span className="accent-glow w-1.5 h-6 sm:h-7 rounded-full bg-gradient-to-b from-brand-400 to-brand-700" />
          {title}
        </h2>
        {bn && <p className="text-sm text-slate-500 mt-0.5 ml-[18px]">{bn}</p>}
      </div>
      <Link href={href} className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800 group">
        {linkLabel}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
