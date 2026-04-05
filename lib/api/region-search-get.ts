import { NextRequest, NextResponse } from "next/server";
import { discoverySearch } from "@/lib/discovery-search";

export async function handleRegionSearchGet(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "Missing required query param: q" },
      { status: 400 },
    );
  }

  try {
    const results = await discoverySearch(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Discovery search failed:", error);
    return NextResponse.json(
      { error: "Search provider unavailable" },
      { status: 502 },
    );
  }
}
