"use server";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  buildIngestionReviewUrl,
  parsePage,
  parsePageSize,
  parseStatus,
  type QueueStatus,
  type ReviewListQuery,
} from "./review-params";

function readReviewQueryFromForm(formData: FormData): ReviewListQuery {
  const status = parseStatus(String(formData.get("status") ?? ""));
  const page = parsePage(String(formData.get("page") ?? "1"));
  const pageSize = parsePageSize(
    String(formData.get("page_size") ?? ""),
    String(formData.get("limit") ?? ""),
  );
  const dish = String(formData.get("dish") ?? "").trim().toLowerCase();
  return {
    status,
    page,
    pageSize,
    ...(dish ? { dish } : {}),
  };
}

function redirectWithToast(q: ReviewListQuery, toast: "ok" | string) {
  const base = buildIngestionReviewUrl(q);
  const sep = base.includes("?") ? "&" : "?";
  if (toast === "ok") {
    redirect(`${base}${sep}ok=1`);
  }
  redirect(`${base}${sep}error=${encodeURIComponent(toast)}`);
}

async function applyDecision(
  rowId: number,
  decision: "accepted" | "rejected" | "flagged",
  reason: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const newStatus =
    decision === "accepted"
      ? "validated"
      : decision === "rejected"
        ? "rejected"
        : "needs_review";

  const supabase = getSupabaseServerClient();
  const { error: updateError } = await supabase
    .schema("staging")
    .from("ingestion_raw")
    .update({
      status: newStatus,
      processed_at: new Date().toISOString(),
    })
    .eq("id", rowId);

  if (updateError) {
    return { ok: false, message: "update_failed" };
  }

  const { error: auditError } = await supabase
    .schema("staging")
    .from("ingestion_audit")
    .insert({
      ingestion_raw_id: rowId,
      decision,
      reason,
    });

  if (auditError) {
    return { ok: false, message: "audit_failed" };
  }

  return { ok: true };
}

export async function decide(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?next=/admin/ingestion-review");
  }

  const q = readReviewQueryFromForm(formData);
  const rowId = Number(formData.get("row_id"));
  const decision = String(formData.get("decision") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const reasonOrNull = reason.length > 0 ? reason : null;

  if (!Number.isInteger(rowId) || rowId < 1) {
    redirectWithToast(q, "invalid_row_id");
  }
  if (!["accepted", "rejected", "flagged"].includes(decision)) {
    redirectWithToast(q, "invalid_decision");
  }

  const result = await applyDecision(
    rowId,
    decision as "accepted" | "rejected" | "flagged",
    reasonOrNull,
  );
  if (!result.ok) {
    redirectWithToast(q, result.message);
  }

  redirectWithToast(q, "ok");
}

export async function decideBulk(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?next=/admin/ingestion-review");
  }

  const q = readReviewQueryFromForm(formData);
  const decision = String(formData.get("decision") ?? "").trim();
  const reason = String(formData.get("bulk_reason") ?? "").trim();
  const reasonOrNull = reason.length > 0 ? reason : null;

  let ids: number[] = [];
  const raw = String(formData.get("row_ids") ?? "").trim();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      ids = parsed
        .map((x) => Number(x))
        .filter((n) => Number.isInteger(n) && n >= 1);
    }
  } catch {
    ids = [];
  }

  if (ids.length === 0) {
    redirectWithToast(q, "no_rows_selected");
  }
  if (!["accepted", "rejected", "flagged"].includes(decision)) {
    redirectWithToast(q, "invalid_decision");
  }

  let failed = 0;
  for (const rowId of ids) {
    const result = await applyDecision(
      rowId,
      decision as "accepted" | "rejected" | "flagged",
      reasonOrNull,
    );
    if (!result.ok) failed += 1;
  }

  if (failed > 0) {
    redirectWithToast(q, `bulk_partial_failed_${failed}`);
  }

  redirectWithToast(q, "ok");
}
