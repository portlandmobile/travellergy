import { getSupabaseServerClient } from "@/lib/supabase-server";

export type RegionMeta = {
  slug: string;
  name: string;
  country_code: string;
};

/**
 * Lightweight region row for titles/descriptions (city pages, sitemap).
 */
export async function getRegionMeta(
  slug: string,
): Promise<RegionMeta | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("regions")
    .select("slug,name,country_code")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as RegionMeta;
}

export type SitemapPaths = {
  regionSlugs: string[];
  dishSlugs: string[];
  ecosystemPaths: { regionSlug: string; ecosystemSlug: string }[];
};

/**
 * All public slugs for sitemap generation.
 */
export async function getSitemapPaths(): Promise<SitemapPaths> {
  const supabase = getSupabaseServerClient();

  const [{ data: regions, error: re }, { data: dishes, error: de }, { data: links, error: le }] =
    await Promise.all([
      supabase.from("regions").select("slug").order("slug"),
      supabase.from("dishes").select("slug").order("slug"),
      supabase.from("region_culinary_ecosystem").select("region_id, ecosystem_id"),
    ]);

  if (re) throw new Error(re.message);
  if (de) throw new Error(de.message);
  if (le) throw new Error(le.message);

  const regionSlugs = (regions ?? []).map((r) => r.slug as string).filter(Boolean);
  const dishSlugs = (dishes ?? []).map((d) => d.slug as string).filter(Boolean);

  const regionRows = await supabase.from("regions").select("id, slug");
  if (regionRows.error) throw new Error(regionRows.error.message);
  const idToRegionSlug = new Map(
    (regionRows.data ?? []).map((r) => [r.id as string, r.slug as string]),
  );

  const ecoRows = await supabase.from("culinary_ecosystems").select("id, slug");
  if (ecoRows.error) throw new Error(ecoRows.error.message);
  const idToEcoSlug = new Map(
    (ecoRows.data ?? []).map((e) => [e.id as string, e.slug as string]),
  );

  const ecosystemPaths: SitemapPaths["ecosystemPaths"] = [];
  for (const row of links ?? []) {
    const regionSlug = idToRegionSlug.get(row.region_id as string);
    const ecosystemSlug = idToEcoSlug.get(row.ecosystem_id as string);
    if (regionSlug && ecosystemSlug) {
      ecosystemPaths.push({ regionSlug, ecosystemSlug });
    }
  }

  return { regionSlugs, dishSlugs, ecosystemPaths };
}
