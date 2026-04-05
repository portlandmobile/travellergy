import {
  getEcosystemsCollectionName,
  getRegionsCollectionName,
  getTypesenseClient,
} from "@/lib/typesense-server";

export type DiscoverySearchHit =
  | { kind: "region"; slug: string; name: string; country_code: string }
  | {
      kind: "ecosystem";
      slug: string;
      name: string;
      name_local: string | null;
      country_code: string;
      city_slug: string;
    };

type EcosystemDoc = {
  slug?: string;
  name?: string;
  name_local?: string;
  country_code?: string;
  city_slug?: string;
};

type RegionDoc = {
  slug?: string;
  name?: string;
  country_code?: string;
};

const PAGE_EACH = 8;
const MAX_TOTAL = 12;

export async function discoverySearch(query: string): Promise<DiscoverySearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const client = getTypesenseClient();
  const regionName = getRegionsCollectionName();

  const regionResp = await client
    .collections(regionName)
    .documents()
    .search({
      q,
      query_by: "name",
      per_page: PAGE_EACH,
    });

  const regionHits: DiscoverySearchHit[] = (regionResp.hits ?? [])
    .map((hit) => hit.document as Partial<RegionDoc>)
    .filter(
      (doc): doc is RegionDoc =>
        Boolean(doc.slug && doc.name && doc.country_code),
    )
    .map((doc) => ({
      kind: "region" as const,
      slug: doc.slug!,
      name: doc.name!,
      country_code: doc.country_code!,
    }));

  let ecosystemHits: DiscoverySearchHit[] = [];
  try {
    const ecoName = getEcosystemsCollectionName();
    const ecoResp = await client.collections(ecoName).documents().search({
      q,
      query_by: "name,name_local",
      per_page: PAGE_EACH,
    });
    ecosystemHits = (ecoResp.hits ?? [])
      .map((hit) => hit.document as Partial<EcosystemDoc>)
      .filter((doc): doc is EcosystemDoc & { slug: string; name: string; country_code: string; city_slug: string } =>
        Boolean(doc.slug && doc.name && doc.country_code && doc.city_slug),
      )
      .map((doc) => ({
        kind: "ecosystem" as const,
        slug: doc.slug,
        name: doc.name,
        name_local: doc.name_local ?? null,
        country_code: doc.country_code,
        city_slug: doc.city_slug,
      }));
  } catch {
    /* collection may not exist until sync script runs */
  }

  return [...ecosystemHits, ...regionHits].slice(0, MAX_TOTAL);
}
