import { getSupabaseServerClient } from "@/lib/supabase-server";

export type RegionDishRiskLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export type RegionDishCard = {
  slug: string;
  name_en: string;
  prevalence: string;
  risk_level: RegionDishRiskLevel;
  ingredient_names: string[];
};

type MappingRow = {
  prevalence: string;
  dish_id: string;
  dishes: {
    slug: string;
    name_en: string;
  } | null;
};

type IngredientRiskRow = {
  dish_id: string;
  dishes: {
    id: string;
  } | null;
  ingredients: {
    risk_level: string;
    name: string;
  } | null;
};

function aggregateRiskLevel(risks: string[]): RegionDishRiskLevel {
  if (risks.includes("HIGH")) return "HIGH";
  if (risks.includes("MEDIUM")) return "MEDIUM";
  if (risks.includes("LOW")) return "LOW";
  return "UNKNOWN";
}

export async function getRegionDishes(slug: string) {
  const supabase = getSupabaseServerClient();

  const { data: region, error: regionError } = await supabase
    .from("regions")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle();

  if (regionError) {
    throw new Error(regionError.message);
  }

  if (!region) {
    return null;
  }

  const { data: mappings, error: mappingError } = await supabase
    .from("region_dish_mapping")
    .select("dish_id,prevalence,dishes: dish_id (slug,name_en)")
    .eq("region_id", region.id);

  if (mappingError) {
    throw new Error(mappingError.message);
  }

  const mappingRows = (mappings ?? []) as unknown as MappingRow[];
  const dishIds = mappingRows.map((row) => row.dish_id);

  let risksByDishId = new Map<string, RegionDishRiskLevel>();
  let ingredientNamesByDishId = new Map<string, string[]>();
  if (dishIds.length > 0) {
    const { data: ingredientRows, error: ingredientError } = await supabase
      .from("dish_ingredients")
      .select(
        "dish_id,dishes: dish_id (id),ingredients: ingredient_id (risk_level,name)",
      )
      .in("dish_id", dishIds);

    if (ingredientError) {
      throw new Error(ingredientError.message);
    }

    const rows = (ingredientRows ?? []) as unknown as IngredientRiskRow[];
    const grouped = new Map<string, string[]>();
    const namesByDishId = new Map<string, string[]>();

    for (const row of rows) {
      const dishId = row.dishes?.id ?? row.dish_id;
      const risk = row.ingredients?.risk_level?.toUpperCase();
      const name = row.ingredients?.name?.trim();
      if (dishId && risk) {
        const current = grouped.get(dishId) ?? [];
        current.push(risk);
        grouped.set(dishId, current);
      }
      if (dishId && name) {
        const n = namesByDishId.get(dishId) ?? [];
        n.push(name);
        namesByDishId.set(dishId, n);
      }
    }

    risksByDishId = new Map(
      Array.from(grouped.entries()).map(([dishId, risks]) => [
        dishId,
        aggregateRiskLevel(risks),
      ]),
    );
    ingredientNamesByDishId = namesByDishId;
  }

  const dishes: RegionDishCard[] = mappingRows
    .filter((row) => row.dishes)
    .map((row) => ({
      slug: row.dishes!.slug,
      name_en: row.dishes!.name_en,
      prevalence: row.prevalence,
      risk_level: risksByDishId.get(row.dish_id) ?? "UNKNOWN",
      ingredient_names: ingredientNamesByDishId.get(row.dish_id) ?? [],
    }));

  return {
    region: { slug: region.slug, name: region.name },
    dishes,
  };
}
