import { getSupabaseServerClient } from "@/lib/supabase-server";

export type CulinaryEcosystemRow = {
  slug: string;
  name_en: string;
  name_local: string | null;
  description: string | null;
  seo_description: string | null;
};

type EcoDb = CulinaryEcosystemRow & { id: string };

export async function listEcosystemsForRegionSlug(
  regionSlug: string,
): Promise<CulinaryEcosystemRow[]> {
  const supabase = getSupabaseServerClient();

  const { data: region, error: re } = await supabase
    .from("regions")
    .select("id")
    .eq("slug", regionSlug)
    .maybeSingle();

  if (re || !region) return [];

  const { data: links, error: le } = await supabase
    .from("region_culinary_ecosystem")
    .select("sort_order, ecosystem_id")
    .eq("region_id", region.id)
    .order("sort_order", { ascending: true });

  if (le || !links?.length) return [];

  const ids = links.map((l) => l.ecosystem_id as string);
  const { data: ecosystems, error: ee } = await supabase
    .from("culinary_ecosystems")
    .select("id,slug,name_en,name_local,description,seo_description")
    .in("id", ids);

  if (ee || !ecosystems?.length) return [];

  const byId = new Map((ecosystems as EcoDb[]).map((e) => [e.id, e]));

  return links
    .map((l) => byId.get(l.ecosystem_id as string))
    .filter((e): e is EcoDb => Boolean(e))
    .map((e) => ({
      slug: e.slug,
      name_en: e.name_en,
      name_local: e.name_local,
      description: e.description,
      seo_description: e.seo_description,
    }));
}

export async function getEcosystemInRegion(args: {
  regionSlug: string;
  ecosystemSlug: string;
}): Promise<CulinaryEcosystemRow | null> {
  const supabase = getSupabaseServerClient();

  const { data: region, error: re } = await supabase
    .from("regions")
    .select("id")
    .eq("slug", args.regionSlug)
    .maybeSingle();

  if (re || !region) return null;

  const { data: eco, error: ee } = await supabase
    .from("culinary_ecosystems")
    .select("id,slug,name_en,name_local,description,seo_description")
    .eq("slug", args.ecosystemSlug)
    .maybeSingle();

  if (ee || !eco) return null;

  const ecoRow = eco as EcoDb;

  const { data: linkRow, error: le } = await supabase
    .from("region_culinary_ecosystem")
    .select("region_id")
    .eq("region_id", region.id)
    .eq("ecosystem_id", ecoRow.id)
    .maybeSingle();

  if (le || !linkRow) return null;

  return {
    slug: ecoRow.slug,
    name_en: ecoRow.name_en,
    name_local: ecoRow.name_local,
    description: ecoRow.description,
    seo_description: ecoRow.seo_description,
  };
}
