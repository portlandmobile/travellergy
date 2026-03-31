import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ingestionSecretConfigured,
  verifyIngestionBearer,
} from "@/lib/ingestion-auth";
import { clarifySupabaseStagingError } from "@/lib/ingestion-errors";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  decision: z.enum(["accepted", "rejected", "flagged"]),
  reason: z.string().trim().max(300).optional(),
});

function statusFromDecision(decision: "accepted" | "rejected" | "flagged") {
  if (decision === "accepted") return "validated";
  if (decision === "rejected") return "rejected";
  return "needs_review";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!ingestionSecretConfigured()) {
    return NextResponse.json(
      { error: "INGESTION_API_SECRET is not configured" },
      { status: 503 },
    );
  }
  if (!verifyIngestionBearer(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId) || rowId < 1) {
    return NextResponse.json({ error: "Invalid ingestion row id" }, { status: 400 });
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

  const { decision, reason } = parsed.data;
  const newStatus = statusFromDecision(decision);

  const supabase = getSupabaseServerClient();

  const { data: updated, error: updateError } = await supabase
    .schema("staging")
    .from("ingestion_raw")
    .update({
      status: newStatus,
      processed_at: new Date().toISOString(),
    })
    .eq("id", rowId)
    .select("id, status")
    .single();

  if (updateError) {
    const msg = clarifySupabaseStagingError(updateError.message ?? "Update failed");
    if (updateError.code === "PGRST116") {
      return NextResponse.json({ error: "Ingestion row not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { error: auditError } = await supabase
    .schema("staging")
    .from("ingestion_audit")
    .insert({
      ingestion_raw_id: rowId,
      decision,
      reason: reason ?? null,
    });

  if (auditError) {
    return NextResponse.json(
      {
        error: "Decision saved but audit insert failed",
        detail: clarifySupabaseStagingError(auditError.message ?? "Unknown audit error"),
        ingestion_raw_id: rowId,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ingestion_raw_id: updated.id,
    status: updated.status,
    decision,
    reason: reason ?? null,
  });
}
