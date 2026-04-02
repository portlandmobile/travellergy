import { ZodError } from "zod";
import { DishSchema, type Dish } from "./schema";

export type Confidence = "high" | "low";

export type TransformResult =
  | {
      success: true;
      data: Dish;
      error: null;
      confidence: Confidence;
      /** Empty when `confidence` is `high`. Explains why a row may be `needs_review`. */
      lowConfidenceReasons: string[];
    }
  | {
      success: false;
      data: null;
      error: string;
      confidence: "low";
      lowConfidenceReasons: ["invalid_dish_schema"];
    };

function zodErrorMessage(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

/**
 * Validates unknown payload against DishSchema and assigns confidence.
 * Low confidence reasons (see `lowConfidenceReasons`): `no_ingredients`,
 * `missing_description`, `weak_ingredient_line`, `missing_allergen_risk`, or `invalid_dish_schema`.
 *
 * If Edamam returns at least one ingredient, a missing description does **not** lower
 * confidence (ingredient list is enough to auto-validate for ingestion).
 */
export function transformAndValidate(input: unknown): TransformResult {
  const parsed = DishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: zodErrorMessage(parsed.error),
      confidence: "low",
      lowConfidenceReasons: ["invalid_dish_schema"],
    };
  }

  const data = { ...parsed.data };
  const ingredients = data.ingredients ?? [];
  const hasWeakIngredient = ingredients.some(
    (i) => i.name.trim().length < 2 || /^[\d\s.,/]+$/.test(i.name.trim()),
  );

  const lowConfidenceReasons: string[] = [];
  if (ingredients.length === 0) {
    lowConfidenceReasons.push("no_ingredients");
    if (!data.description?.trim()) {
      lowConfidenceReasons.push("missing_description");
    }
  }
  if (hasWeakIngredient) lowConfidenceReasons.push("weak_ingredient_line");
  if (ingredients.some((i) => i.allergen_risk === undefined)) {
    lowConfidenceReasons.push("missing_allergen_risk");
  }

  // Derive risk heuristic
  const hasHighRisk = ingredients.some((i) => i.allergen_risk === "HIGH");
  const hasMediumRisk = ingredients.some((i) => i.allergen_risk === "MEDIUM");
  data.risk_level = hasHighRisk ? "high-risk" : hasMediumRisk ? "caution" : "safe";
  data.safety_tips = ingredients
    .filter((i) => i.allergen_risk === "HIGH")
    .map((i) => `Contains ${i.name.trim()}`);

  const confidence: Confidence = lowConfidenceReasons.length > 0 ? "low" : "high";

  return {
    success: true,
    data,
    error: null,
    confidence,
    lowConfidenceReasons,
  };
}
