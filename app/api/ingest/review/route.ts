import { NextResponse } from "next/server";
import {
  ingestionSecretConfigured,
  verifyIngestionBearer,
} from "@/lib/ingestion-auth";
import { clarifySupabaseStagingError } from "@/lib/ingestion-errors";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set(["pending", "needs_review", "validated", "rejected"]);

export async function GET(request: Request) {
  if (!ingestionSecretConfigured()) {
    return NextResponse.json(
      { error: "INGESTION_API_SECRET is not configured" },
      { status: 503 },
    );
  }
  if (!verifyIngestionBearer(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") ?? "needs_review").trim();
  const limitRaw = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(Math.floor(limitRaw), 100))
    : 20;

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "Invalid status. Use pending|needs_review|validated|rejected." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .schema("staging")
    .from("ingestion_raw")
    .select("id, source_name, status, created_at, processed_at, raw_data")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: clarifySupabaseStagingError(error.message ?? "Query failed") },
      { status: 500 },
    );
  }

  const rows = (data ?? []).map((row) => {
    const payload = row.raw_data as Record<string, unknown> | null;
    const mapped =
      payload && typeof payload === "object"
        ? (payload.mapped as Record<string, unknown> | undefined)
        : undefined;
    const transform =
      payload && typeof payload === "object"
        ? (payload.transform as Record<string, unknown> | undefined)
        : undefined;
    return {
      id: row.id,
      source_name: row.source_name,
      status: row.status,
      created_at: row.created_at,
      processed_at: row.processed_at,
      requested_query:
        payload && typeof payload.requested_query === "string"
          ? payload.requested_query
          : null,
      dish_preview: mapped
        ? {
            slug: typeof mapped.slug === "string" ? mapped.slug : null,
            name_en: typeof mapped.name_en === "string" ? mapped.name_en : null,
          }
        : null,
      transform: transform
        ? {
            success: Boolean(transform.success),
            confidence:
              typeof transform.confidence === "string" ? transform.confidence : null,
            low_confidence_reasons: Array.isArray(transform.low_confidence_reasons)
              ? transform.low_confidence_reasons
              : [],
          }
        : null,
    };
  });

  return NextResponse.json({ status, count: rows.length, rows });
}
