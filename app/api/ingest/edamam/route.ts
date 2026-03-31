import { NextResponse } from "next/server";
import { z } from "zod";
import { EdamamAdapter, transformAndValidate } from "@/lib/pipeline";
import {
  ingestionSecretConfigured,
  verifyIngestionBearer,
} from "@/lib/ingestion-auth";
import { clarifySupabaseStagingError } from "@/lib/ingestion-errors";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  query: z.string().trim().min(1).max(200),
});

function deriveStatusAndAudit(transform: ReturnType<typeof transformAndValidate>): {
  status: "validated" | "needs_review" | "rejected";
  decision: "accepted" | "flagged" | "rejected";
  reason: string | null;
} {
  if (!transform.success) {
    return {
      status: "rejected",
      decision: "rejected",
      reason: transform.error,
    };
  }
  if (transform.confidence === "low") {
    return {
      status: "needs_review",
      decision: "flagged",
      reason: "Low confidence from transform gate",
    };
  }
  return { status: "validated", decision: "accepted", reason: null };
}

export async function POST(request: Request) {
  if (!ingestionSecretConfigured()) {
    return NextResponse.json(
      { error: "INGESTION_API_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!verifyIngestionBearer(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const { query } = parsed.data;

  let fetchResult: Awaited<ReturnType<EdamamAdapter["searchFirstDish"]>>;
  try {
    const adapter = new EdamamAdapter();
    fetchResult = await adapter.searchFirstDish(query);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Edamam request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const transform = transformAndValidate(fetchResult.mapped);
  const { status, decision, reason } = deriveStatusAndAudit(transform);

  const rawData = {
    requested_query: query,
    source: fetchResult.source,
    edamam_response: fetchResult.raw,
    mapped: fetchResult.mapped,
    transform: {
      success: transform.success,
      confidence: transform.confidence,
      error: transform.success ? null : transform.error,
      low_confidence_reasons: transform.lowConfidenceReasons,
      dish: transform.success ? transform.data : null,
    },
  };

  const supabase = getSupabaseServerClient();

  const { data: inserted, error: insertError } = await supabase
    .schema("staging")
    .from("ingestion_raw")
    .insert({
      source_name: "edamam_recipe_v2",
      raw_data: rawData,
      status,
    })
    .select("id")
    .single();

  if (insertError) {
    const message = clarifySupabaseStagingError(
      insertError.message ?? "Failed to persist ingestion row",
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const rawId = inserted.id as number;

  const { error: auditError } = await supabase
    .schema("staging")
    .from("ingestion_audit")
    .insert({
      ingestion_raw_id: rawId,
      decision,
      reason: reason ?? null,
    });

  if (auditError) {
    return NextResponse.json(
      {
        error: "Row created but audit log failed",
        detail: clarifySupabaseStagingError(
          auditError.message ?? "Unknown audit error",
        ),
        ingestion_raw_id: rawId,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ingestion_raw_id: rawId,
    status,
    decision,
    transform: {
      success: transform.success,
      confidence: transform.confidence,
      error: transform.success ? null : transform.error,
      low_confidence_reasons: transform.lowConfidenceReasons,
    },
    dish_preview:
      transform.success && transform.data
        ? {
            slug: transform.data.slug,
            name_en: transform.data.name_en,
            ingredient_count: transform.data.ingredients.length,
          }
        : null,
  });
}
