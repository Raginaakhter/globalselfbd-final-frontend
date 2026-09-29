import { Star } from "lucide-react";

/** Read-only star rating; half stars are drawn for averages like 4.5. */
export default function Stars({ value, size = "w-4 h-4", className = "" }: { value: number; size?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className={`relative inline-block ${size}`}>
            <Star className={`absolute inset-0 ${size} text-slate-300`} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${size} fill-amber-400 text-amber-400`} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
