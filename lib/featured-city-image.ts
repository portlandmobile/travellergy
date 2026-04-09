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

/** Stable positive integer per slug so Lorem Flickr returns one image per city (not a random swap on each load). */
function loremFlickrLockId(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 9_999_991 + 1;
}

export function loremFlickrCityFoodUrl(cityName: string, slug: string): string {
  const tags = cityFoodFlickrTags(cityName, slug);
  const lock = loremFlickrLockId(slug);
  return `https://loremflickr.com/1200/400/${tags}?lock=${lock}`;
}

export async function resolveFeaturedCityHeroImage(
  slug: string,
  cityName: string,
): Promise<string> {
  if (process.env.UNSPLASH_ACCESS_KEY) {
    // Cache key MUST include `slug`. A single global key made every city reuse the first city's image.
    const fromUnsplash = await unstable_cache(
      async () => fetchUnsplashCityFoodUrl(cityName),
      ["featured-city-unsplash-food", slug],
      { revalidate: 604800 },
    )();
    if (fromUnsplash) return fromUnsplash;
  }
  return loremFlickrCityFoodUrl(cityName, slug);
}
