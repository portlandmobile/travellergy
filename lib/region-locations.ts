import { getSupabaseServerClient } from "@/lib/supabase-server";

type LocationRow = {
  id: string;
  name: string;
  dish_id: string | null;
  dishes: { slug: string; name_en: string } | null;
};

export async function getRegionLocations(slug: string) {
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

  const { data: rows, error: locError } = await supabase
    .from("locations")
    .select("id,name,dish_id,dishes: dish_id (slug,name_en)")
    .eq("region_id", region.id)
    .order("name", { ascending: true });

  if (locError) {
    throw new Error(locError.message);
  }

  const locations = ((rows ?? []) as unknown as LocationRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    dish_slug: row.dishes?.slug ?? null,
    dish_name: row.dishes?.name_en ?? null,
  }));

  return {
    region: { slug: region.slug, name: region.name },
    locations,
  };
}
