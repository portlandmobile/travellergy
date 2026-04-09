import type { MetadataRoute } from "next";
import { getSitemapPaths } from "@/lib/seo-queries";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
  ];

  try {
    const { regionSlugs, dishSlugs, ecosystemPaths } = await getSitemapPaths();

    const regions: MetadataRoute.Sitemap = regionSlugs.map((slug) => ({
      url: `${SITE_URL}/city/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    }));

    const dishes: MetadataRoute.Sitemap = dishSlugs.map((slug) => ({
      url: `${SITE_URL}/dishes/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    const ecosystems: MetadataRoute.Sitemap = ecosystemPaths.map(
      ({ regionSlug, ecosystemSlug }) => ({
        url: `${SITE_URL}/city/${regionSlug}/ecosystem/${ecosystemSlug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
      }),
    );

    return [...staticEntries, ...regions, ...dishes, ...ecosystems];
  } catch {
    return staticEntries;
  }
}
