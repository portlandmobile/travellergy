import type { NextRequest } from "next/server";
import { handleRegionSearchGet } from "@/lib/api/region-search-get";

/** Non-breaking alias of `GET /api/regions/search` (see API-SPEC.md /api/v1). */
export async function GET(request: NextRequest) {
  return handleRegionSearchGet(request);
}
