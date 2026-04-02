import type { RegionDishRiskLevel } from "@/lib/regions-dishes";

/** City hub cards: show only for UNKNOWN (TBD). Hide for HIGH / MEDIUM / LOW. */
export function SafetyIndicator({
  riskLevel,
}: {
  riskLevel: RegionDishRiskLevel;
}) {
  if (riskLevel !== "UNKNOWN") return null;
  return (
    <span
      className="shrink-0 rounded-full border border-charcoal/15 bg-charcoal/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-charcoal/65"
      title="Allergen assessment pending"
    >
      TBD
    </span>
  );
}
