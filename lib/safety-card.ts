import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getDishDetails } from "@/lib/dish-details";
import type { SafetyCardLocaleCode } from "@/lib/supported-locales";

type TemplateRow = {
  native_script_header_template: string;
  allergen_warning_template: string;
  safety_instructions_templates: unknown;
  disclaimer_template: string;
};

function applyVars(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

function allergenSummaryFromIngredients(
  ingredients: { name: string; allergen_risk: string; is_hidden: boolean }[],
): string {
  const parts = ingredients
    .filter(
      (i) =>
        i.allergen_risk === "HIGH" ||
        i.allergen_risk === "MEDIUM" ||
        i.is_hidden,
    )
    .map((i) => i.name);
  const unique = [...new Set(parts)];
  if (unique.length === 0) {
    return ingredients.map((i) => i.name).slice(0, 8).join(", ") || "unknown ingredients";
  }
  return unique.join(", ");
}

function parseInstructions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export type SafetyCardPayload = {
  native_script_header: string;
  allergen_warning: string;
  safety_instructions: string[];
  disclaimer: string;
};

export async function buildSafetyCardPayload(
  dishSlug: string,
  locale: SafetyCardLocaleCode,
): Promise<SafetyCardPayload | null> {
  const supabase = getSupabaseServerClient();

  const { data: tpl, error: te } = await supabase
    .from("safety_card_templates")
    .select(
      "native_script_header_template,allergen_warning_template,safety_instructions_templates,disclaimer_template",
    )
    .eq("locale_code", locale)
    .maybeSingle();

  if (te || !tpl) return null;

  const dish = await getDishDetails(dishSlug);
  if (!dish) return null;

  const template = tpl as TemplateRow;
  const ingredients = dish.dish.ingredients;
  const allergen_summary = allergenSummaryFromIngredients(ingredients);
  const dish_name_en = dish.dish.name_en;
  const dish_name_local =
    dish.dish.name_local?.trim() || dish.dish.name_en;

  const vars = {
    dish_name_en,
    dish_name_local,
    allergen_summary,
  };

  const safety_instructions = parseInstructions(
    template.safety_instructions_templates,
  ).map((line) => applyVars(line, vars));

  return {
    native_script_header: applyVars(
      template.native_script_header_template,
      vars,
    ),
    allergen_warning: applyVars(template.allergen_warning_template, vars),
    safety_instructions,
    disclaimer: applyVars(template.disclaimer_template, vars),
  };
}
