import { unstable_cache } from "next/cache";

/**
 * Stock hero for featured city cards: search query is always `"{cityName} food"`.
 * Prefer Unsplash (needs `UNSPLASH_ACCESS_KEY`); otherwise Lorem Flickr tag search.
 */

async function fetchUnsplashCityFoodUrl(cityName: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const query = encodeURIComponent(`${cityName.trim()} food`);
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
    {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 604800 },
    },
  );

  if (!res.ok) return null;

  const json = (await res.json()) as {
    results?: { urls?: { regular?: string } }[];
  };
  const regular = json.results?.[0]?.urls?.regular;
  if (!regular) return null;

  const u = new URL(regular);
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "crop");
  u.searchParams.set("w", "1200");
  u.searchParams.set("q", "80");
  return u.toString();
}

/** Comma-separated Flickr tags: city tokens + `food` (AND). */
export function cityFoodFlickrTags(cityName: string, slug: string): string {
  const parts = cityName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 0 && p !== "food");

  if (parts.length === 0) {
    return `${slug.replace(/-/g, ",")},food`;
  }
  return `${parts.join(",")},food`;
}

export function loremFlickrCityFoodUrl(cityName: string, slug: string): string {
  const tags = cityFoodFlickrTags(cityName, slug);
  return `https://loremflickr.com/1200/400/${tags}`;
}

const cachedUnsplashCityFood = unstable_cache(
  async (slug: string, cityName: string) => {
    return fetchUnsplashCityFoodUrl(cityName);
  },
  ["featured-city-unsplash-food"],
  { revalidate: 604800 },
);

export async function resolveFeaturedCityHeroImage(
  slug: string,
  cityName: string,
): Promise<string> {
  const fromUnsplash = await cachedUnsplashCityFood(slug, cityName);
  if (fromUnsplash) return fromUnsplash;
  return loremFlickrCityFoodUrl(cityName, slug);
}
