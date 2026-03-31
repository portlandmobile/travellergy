import { getSupabaseServerClient } from "@/lib/supabase-server";

export type FeaturedRegion = {
  slug: string;
  name: string;
  country_code: string;
};

export async function getFeaturedRegions(limit = 6): Promise<FeaturedRegion[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("regions")
    .select("slug,name,country_code")
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeaturedRegion[];
}
