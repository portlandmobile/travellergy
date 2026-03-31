import { NextResponse } from "next/server";
import { getRegionLocations } from "@/lib/region-locations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  try {
    const data = await getRegionLocations(slug);
    if (!data) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
