import { NextRequest, NextResponse } from "next/server";
import { getRegionsCollectionName, getTypesenseClient } from "@/lib/typesense-server";

type RegionSearchResult = {
  slug: string;
  name: string;
  country_code: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "Missing required query param: q" },
      { status: 400 },
    );
  }

  try {
    const client = getTypesenseClient();
    const collectionName = getRegionsCollectionName();

    const response = await client
      .collections(collectionName)
      .documents()
      .search({
        q: query,
        query_by: "name",
        per_page: 8,
      });

    const results: RegionSearchResult[] = (response.hits ?? [])
      .map((hit) => hit.document as Partial<RegionSearchResult>)
      .filter(
        (doc): doc is RegionSearchResult =>
          Boolean(doc.slug && doc.name && doc.country_code),
      )
      .map((doc) => ({
        slug: doc.slug,
        name: doc.name,
        country_code: doc.country_code,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Typesense region search failed:", error);
    return NextResponse.json(
      { error: "Search provider unavailable" },
      { status: 502 },
    );
  }
}
