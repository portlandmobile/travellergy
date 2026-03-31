import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type QueueStatus = "pending" | "needs_review" | "validated" | "rejected";

type IngestionRow = {
  id: number;
  source_name: string;
  status: string;
  created_at: string | null;
  processed_at: string | null;
  raw_data: unknown;
};

const STATUS_VALUES: QueueStatus[] = [
  "needs_review",
  "pending",
  "validated",
  "rejected",
];

function parseStatus(value: string | undefined): QueueStatus {
  if (value && STATUS_VALUES.includes(value as QueueStatus)) {
    return value as QueueStatus;
  }
  return "needs_review";
}

function rowSummary(raw: unknown) {
  const payload = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const mapped =
    payload && payload.mapped && typeof payload.mapped === "object"
      ? (payload.mapped as Record<string, unknown>)
      : null;
  const transform =
    payload && payload.transform && typeof payload.transform === "object"
      ? (payload.transform as Record<string, unknown>)
      : null;

  const reasons = Array.isArray(transform?.low_confidence_reasons)
    ? transform?.low_confidence_reasons.filter((v): v is string => typeof v === "string")
    : [];

  return {
    query: typeof payload?.requested_query === "string" ? payload.requested_query : "",
    nameEn: typeof mapped?.name_en === "string" ? mapped.name_en : "",
    slug: typeof mapped?.slug === "string" ? mapped.slug : "",
    ingredientCount: Array.isArray(mapped?.ingredients) ? mapped.ingredients.length : 0,
    confidence: typeof transform?.confidence === "string" ? transform.confidence : "",
    reasons,
  };
}

async function decide(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?next=/admin/ingestion-review");
  }

  const rowId = Number(formData.get("row_id"));
  const decision = String(formData.get("decision") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const status = parseStatus(String(formData.get("status") ?? ""));

  if (!Number.isInteger(rowId) || rowId < 1) {
    redirect(`/admin/ingestion-review?status=${status}&error=invalid_row_id`);
  }
  if (!["accepted", "rejected", "flagged"].includes(decision)) {
    redirect(`/admin/ingestion-review?status=${status}&error=invalid_decision`);
  }

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
    redirect(`/admin/ingestion-review?status=${status}&error=update_failed`);
  }

  const { error: auditError } = await supabase
    .schema("staging")
    .from("ingestion_audit")
    .insert({
      ingestion_raw_id: rowId,
      decision,
      reason: reason.length > 0 ? reason : null,
    });

  if (auditError) {
    redirect(`/admin/ingestion-review?status=${status}&error=audit_failed`);
  }

  redirect(`/admin/ingestion-review?status=${status}&ok=1`);
}

export default async function IngestionReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; limit?: string; ok?: string; error?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?next=/admin/ingestion-review");
  }

  const params = await searchParams;
  const status = parseStatus(params.status);
  const limitRaw = Number(params.limit ?? "30");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(Math.floor(limitRaw), 100)) : 30;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .schema("staging")
    .from("ingestion_raw")
    .select("id, source_name, status, created_at, processed_at, raw_data")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as IngestionRow[];

  return (
    <section className="w-full space-y-4">
      <h1 className="text-xl font-semibold text-black">Ingestion Review</h1>
      <p className="text-sm text-black/70">
        Internal queue for reviewing staged ingestion rows.
      </p>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {STATUS_VALUES.map((s) => (
          <a
            key={s}
            href={`/admin/ingestion-review?status=${s}`}
            className={`rounded border px-2 py-1 ${
              s === status ? "border-black bg-black text-white" : "border-black/20 text-black"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      {params.ok === "1" ? (
        <p className="rounded border border-green-600/30 bg-green-50 px-3 py-2 text-sm text-green-800">
          Review decision saved.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded border border-red-600/30 bg-red-50 px-3 py-2 text-sm text-red-800">
          Action failed: {params.error}
        </p>
      ) : null}

      {error ? (
        <p className="rounded border border-red-600/30 bg-red-50 px-3 py-2 text-sm text-red-800">
          Failed to load queue: {error.message}
        </p>
      ) : null}

      {!error && rows.length === 0 ? (
        <p className="rounded border border-black/10 bg-white px-3 py-2 text-sm text-black/70">
          No rows found for status <span className="font-medium text-black">{status}</span>.
        </p>
      ) : null}

      <div className="space-y-3">
        {rows.map((row) => {
          const summary = rowSummary(row.raw_data);
          return (
            <article key={row.id} className="rounded border border-black/10 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-black">
                    #{row.id} {summary.nameEn ? `- ${summary.nameEn}` : ""}
                  </p>
                  <p className="text-xs text-black/60">
                    source={row.source_name} status={row.status}
                  </p>
                </div>
                <p className="text-xs text-black/60">{row.created_at ?? ""}</p>
              </div>

              <div className="grid gap-1 text-sm text-black/80">
                <p>query: {summary.query || "-"}</p>
                <p>slug: {summary.slug || "-"}</p>
                <p>ingredients: {summary.ingredientCount}</p>
                <p>confidence: {summary.confidence || "-"}</p>
                <p>reasons: {summary.reasons.length > 0 ? summary.reasons.join(", ") : "-"}</p>
              </div>

              <form action={decide} className="space-y-2">
                <input type="hidden" name="row_id" value={row.id} />
                <input type="hidden" name="status" value={status} />
                <input
                  name="reason"
                  placeholder="Optional reason"
                  className="w-full rounded border border-black/20 px-2 py-1 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    name="decision"
                    value="accepted"
                    className="rounded border border-green-700 px-3 py-1 text-sm text-green-800"
                  >
                    Accept
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="rejected"
                    className="rounded border border-red-700 px-3 py-1 text-sm text-red-800"
                  >
                    Reject
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="flagged"
                    className="rounded border border-black/30 px-3 py-1 text-sm text-black"
                  >
                    Keep Flagged
                  </button>
                </div>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
