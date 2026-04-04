import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { IngestionReviewList, type RowDTO } from "./ingestion-review-list";
import {
  buildIngestionReviewUrl,
  buildPageLinks,
  parsePage,
  parsePageSize,
  parseStatus,
  rowSummary,
  STATUS_VALUES,
  type ReviewListQuery,
} from "./review-params";

function describeError(code: string): string {
  switch (code) {
    case "no_rows_selected":
      return "Select at least one row for a bulk action.";
    case "invalid_row_id":
      return "Invalid row id.";
    case "invalid_decision":
      return "Invalid decision.";
    case "update_failed":
      return "Database update failed.";
    case "audit_failed":
      return "Audit log insert failed.";
    default:
      if (code.startsWith("bulk_partial_failed_")) {
        const n = code.slice("bulk_partial_failed_".length);
        return `Bulk action failed for ${n} row(s); others may have succeeded.`;
      }
      return code;
  }
}

export default async function IngestionReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
    page_size?: string;
    limit?: string;
    dish?: string;
    ok?: string;
    error?: string;
  }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?next=/admin/ingestion-review");
  }

  const params = await searchParams;
  const status = parseStatus(params.status);
  const pageSize = parsePageSize(params.page_size, params.limit);
  const dishFilter = (params.dish ?? "").trim().toLowerCase();

  const supabase = getSupabaseServerClient();

  let countQuery = supabase
    .schema("staging")
    .from("ingestion_raw")
    .select("*", { count: "exact", head: true })
    .eq("status", status);

  if (dishFilter) {
    countQuery = countQuery.contains("raw_data", { dish_slug: dishFilter });
  }

  const { count: totalCountRaw, error: countError } = await countQuery;
  const totalCount = totalCountRaw ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  let page = parsePage(params.page);
  if (page > totalPages) page = totalPages;

  const queueQuery: ReviewListQuery = {
    status,
    page,
    pageSize,
    ...(dishFilter ? { dish: dishFilter } : {}),
  };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = supabase
    .schema("staging")
    .from("ingestion_raw")
    .select("id, source_name, status, created_at, processed_at, raw_data")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (dishFilter) {
    dataQuery = dataQuery.contains("raw_data", { dish_slug: dishFilter });
  }

  const { data, error } = await dataQuery;

  type RawRow = {
    id: number;
    source_name: string;
    status: string;
    created_at: string | null;
    raw_data: unknown;
  };

  const rows: RowDTO[] = ((data ?? []) as RawRow[]).map((row) => ({
    id: row.id,
    source_name: row.source_name,
    status: row.status,
    created_at: row.created_at,
    summary: rowSummary(row.raw_data),
  }));

  const nav = buildPageLinks(queueQuery, totalPages);

  return (
    <section className="w-full space-y-4">
      <h1 className="text-xl font-semibold text-black">Ingestion Review</h1>
      <p className="text-sm text-black/70">
        Paginated queue (newest first). Use checkboxes and bulk actions for the current page, or act
        on one row at a time. Filter by canonical{" "}
        <code className="text-xs">dish_slug</code> with the <span className="font-medium">dish</span>{" "}
        query param.
      </p>

      <p className="text-xs text-black/60">
        Example:{" "}
        <a
          className="underline"
          href="/admin/ingestion-review?status=needs_review&dish=rouladen&page_size=25"
        >
          ?status=needs_review&amp;dish=rouladen
        </a>
      </p>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {STATUS_VALUES.map((s) => (
          <a
            key={s}
            href={buildIngestionReviewUrl({ ...queueQuery, status: s, page: 1 })}
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
          Action failed: {describeError(params.error)}
        </p>
      ) : null}

      {countError ? (
        <p className="rounded border border-red-600/30 bg-red-50 px-3 py-2 text-sm text-red-800">
          Failed to count queue: {countError.message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded border border-red-600/30 bg-red-50 px-3 py-2 text-sm text-red-800">
          Failed to load queue: {error.message}
        </p>
      ) : null}

      {!error && !countError && rows.length === 0 ? (
        <p className="rounded border border-black/10 bg-white px-3 py-2 text-sm text-black/70">
          No rows found for status <span className="font-medium text-black">{status}</span>
          {dishFilter ? (
            <>
              {" "}
              with <span className="font-medium text-black">dish_slug={dishFilter}</span>
            </>
          ) : null}
          .
        </p>
      ) : null}

      {!error && !countError && rows.length > 0 ? (
        <IngestionReviewList
          rows={rows}
          queueQuery={queueQuery}
          totalCount={totalCount}
          totalPages={totalPages}
          nav={nav}
        />
      ) : null}
    </section>
  );
}
