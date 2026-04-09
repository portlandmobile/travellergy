"use client";

import { ALLERGEN_FILTERS } from "@/lib/allergen-taxonomy";
import { useAllergenFilter } from "@/app/contexts/allergen-filter-context";

function pillClass(active: boolean) {
  return [
    "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
    active
      ? "border-travellergy-accent bg-travellergy-accent/25 text-charcoal shadow-sm ring-1 ring-travellergy-accent/30"
      : "border-travellergy-accent/35 bg-white text-charcoal/80 shadow-sm hover:border-travellergy-accent/55 hover:bg-travellergy-accent/10",
  ].join(" ");
}

export function AllergenFilterPillBar() {
  const { selectedAllergen, setSelectedAllergen } = useAllergenFilter();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-6 pt-10"
      style={{
        background:
          "linear-gradient(to top, color-mix(in srgb, var(--background) 75%, transparent) 40%, transparent)",
      }}
    >
      <div
        className="pointer-events-auto flex max-w-6xl flex-col gap-2 rounded-2xl border-2 border-travellergy-accent/40 bg-gradient-to-br from-white via-warm to-travellergy-accent/[0.08] px-3 py-3 shadow-[0_-8px_30px_-6px_rgba(224,122,95,0.35),0_4px_14px_-4px_rgba(0,0,0,0.12)] ring-2 ring-travellergy-accent/15 backdrop-blur-md sm:flex-row sm:items-center"
        role="toolbar"
        aria-label="Filter dishes by allergen"
      >
        <span className="hidden px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-travellergy-accent sm:inline sm:w-28">
          Allergen filter
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
