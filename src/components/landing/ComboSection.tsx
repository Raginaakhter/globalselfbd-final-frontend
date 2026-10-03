import SectionHeading from "./SectionHeading";
import ComboCard from "@/components/shop/ComboCard";
import type { Combo } from "@/lib/backend-types";

/** Home page strip of live combos; renders nothing when there are none. */
export default function ComboSection({ combos }: { combos: Combo[] }) {
  if (combos.length === 0) return null;
  return (
    <section id="combos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-32">
      <SectionHeading title="Combo Deals — Buy Together, Save More" bn="কম্বো অফার" href="/combo" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {combos.map((c) => (
          <ComboCard key={c._id} combo={c} />
        ))}
      </div>
    </section>
  );
}
