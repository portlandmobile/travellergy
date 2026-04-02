"use client";

import {
  findAllergenHighlightRanges,
  type AllergenFilterId,
} from "@/lib/allergen-taxonomy";
import { useAllergenFilter } from "@/app/contexts/allergen-filter-context";

type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

function riskBadgeClass(level: RiskLevel): string {
  if (level === "HIGH") return "bg-red-100 text-red-800";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-800";
  if (level === "LOW") return "bg-teal-100 text-teal-800";
  return "bg-gray-100 text-gray-700";
}

function normalizeRisk(value: string): RiskLevel {
  const risk = value.toUpperCase();
  if (risk === "HIGH" || risk === "MEDIUM" || risk === "LOW") return risk;
  return "UNKNOWN";
}

function HighlightedName({
  text,
  allergenId,
}: {
  text: string;
  allergenId: AllergenFilterId | null;
}) {
  if (!allergenId) return <>{text}</>;
  const ranges = findAllergenHighlightRanges(text, allergenId);
  if (ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let i = 0;
  for (const r of ranges) {
    if (r.start > i) parts.push(text.slice(i, r.start));
    parts.push(
      <mark
        key={`${r.start}-${r.end}`}
        className="bg-transparent font-semibold text-travellergy-accent underline decoration-travellergy-accent/70"
      >
        {text.slice(r.start, r.end)}
      </mark>,
    );
    i = r.end;
  }
  if (i < text.length) parts.push(text.slice(i));
  return <>{parts}</>;
}

export type DishIngredientLine = {
  name: string;
  is_hidden: boolean;
  allergen_risk: string;
};

export function DishIngredientsHighlight({
  ingredients,
}: {
  ingredients: DishIngredientLine[];
}) {
  const { selectedAllergen } = useAllergenFilter();

  if (ingredients.length === 0) {
    return (
      <p className="text-sm text-charcoal/70">No ingredient data available.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {ingredients.map((item) => {
        const ingredientRisk = normalizeRisk(item.allergen_risk);
        return (
          <li
            key={`${item.name}-${item.is_hidden ? "hidden" : "visible"}`}
            className="space-y-2 rounded-xl border border-sage/15 bg-white/60 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-charcoal">
                <HighlightedName
                  text={item.name}
                  allergenId={selectedAllergen}
                />
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${riskBadgeClass(ingredientRisk)}`}
              >
                {ingredientRisk === "UNKNOWN" ? "TBD" : ingredientRisk}
              </span>
            </div>
            {item.is_hidden ? (
              <p className="text-sm font-medium text-travellergy-accent">
                Hidden ingredient warning
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
