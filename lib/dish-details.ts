import { getSupabaseServerClient } from "@/lib/supabase-server";

type DishRow = {
  id: string;
  slug: string;
  name_en: string;
  name_local: string | null;
  description: string | null;
};

type IngredientRow = {
  is_hidden_ingredient: boolean;
  ingredients: {
    name: string;
    risk_level: string | null;
  } | null;
};

export async function getDishDetails(slug: string) {
  const supabase = getSupabaseServerClient();

  const { data: dish, error: dishError } = await supabase
    .from("dishes")
    .select("id,slug,name_en,name_local,description")
    .eq("slug", slug)
    .maybeSingle();

  if (dishError) {
    throw new Error(dishError.message);
  }

  if (!dish) return null;

  const typedDish = dish as DishRow;
  const { data: ingredientRows, error: ingredientError } = await supabase
    .from("dish_ingredients")
    .select("is_hidden_ingredient,ingredients: ingredient_id (name,risk_level)")
    .eq("dish_id", typedDish.id);

  if (ingredientError) {
    throw new Error(ingredientError.message);
  }

  const ingredients = ((ingredientRows ?? []) as unknown as IngredientRow[])
    .filter((row) => row.ingredients)
    .map((row) => ({
      name: row.ingredients!.name,
      is_hidden: row.is_hidden_ingredient,
      allergen_risk: row.ingredients!.risk_level ?? "UNKNOWN",
    }));

  return {
    dish: {
      slug: typedDish.slug,
      name_en: typedDish.name_en,
      name_local: typedDish.name_local ?? typedDish.name_en,
      description: typedDish.description ?? "",
      ingredients,
    },
  };
}
