"use client";

import { ALLERGEN_FILTERS } from "@/lib/allergen-taxonomy";
import { useAllergenFilter } from "@/app/contexts/allergen-filter-context";

function pillClass(active: boolean) {
  return [
    "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
    active
      ? "border-travellergy-accent bg-travellergy-accent/15 text-charcoal"
      : "border-sage/25 bg-white/90 text-charcoal/75 hover:border-sage/40 hover:bg-sage/5",
  ].join(" ");
}

export function AllergenFilterPillBar() {
  const { selectedAllergen, setSelectedAllergen } = useAllergenFilter();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-6 pt-10"
      style={{
        background:
          "linear-gradient(to top, var(--background) 55%, transparent)",
      }}
    >
      <div
        className="pointer-events-auto flex max-w-6xl flex-col gap-2 rounded-2xl border-x border-b border-sage/20 border-t border-gray-200 bg-warm/95 px-3 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur-md sm:flex-row sm:items-center"
        role="toolbar"
        aria-label="Filter dishes by allergen"
      >
        <span className="hidden px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage sm:inline sm:w-24">
          Filter
        </span>
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setSelectedAllergen(null)}
            className={pillClass(selectedAllergen === null)}
          >
            All
          </button>
          {ALLERGEN_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedAllergen(f.id)}
              className={pillClass(selectedAllergen === f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
