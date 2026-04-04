import { resolveFeaturedCityHeroImage } from "@/lib/featured-city-image";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type FeaturedRegion = {
  slug: string;
  name: string;
  country_code: string;
  /** Stock image URL for `"{name} food"` (Unsplash search when configured, else Lorem Flickr tags). */
  heroImageUrl: string;
};

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]!];
  }
}

/**
 * Loads every region, shuffles, then returns `sampleSize` cities (default 6).
 * Each request reshuffles so a full refresh shows a new set.
 */
export async function getFeaturedRegions(sampleSize = 6): Promise<FeaturedRegion[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("regions")
    .select("slug,name,country_code")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = [...(data ?? [])] as Omit<FeaturedRegion, "heroImageUrl">[];
  shuffleInPlace(rows);
  const picked = rows.slice(0, Math.min(sampleSize, rows.length));

  return Promise.all(
    picked.map(async (r) => ({
      ...r,
      heroImageUrl: await resolveFeaturedCityHeroImage(r.slug, r.name),
    })),
  );
}
