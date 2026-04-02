"use client";

import { useAllergenFilter } from "@/app/contexts/allergen-filter-context";
import { allergenLabel } from "@/lib/allergen-taxonomy";

type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

function riskBadgeClass(level: RiskLevel): string {
  if (level === "HIGH") return "bg-red-100 text-red-800";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-800";
  if (level === "LOW") return "bg-teal-100 text-teal-800";
  return "bg-gray-100 text-gray-700";
}

export function SafetyPanel({ overallRisk }: { overallRisk: RiskLevel }) {
  const { selectedAllergen } = useAllergenFilter();

  return (
    <div className="space-y-4 rounded-xl border border-sage/20 bg-white/85 p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-charcoal">Overall risk</span>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeClass(overallRisk)}`}
        >
          {overallRisk === "UNKNOWN" ? "TBD" : overallRisk}
        </span>
      </div>

      {selectedAllergen ? (
        <p className="text-sm leading-relaxed text-charcoal/80">
          You are filtering for{" "}
          <strong className="text-travellergy-accent">
            {allergenLabel(selectedAllergen)}
          </strong>
          . Matching words in ingredient names below use the terracotta
          highlight.
        </p>
      ) : null}

      <p className="border-t border-sage/15 pt-4 text-xs leading-relaxed text-charcoal/60">
        Always confirm ingredients with venue staff.
      </p>
    </div>
  );
}
