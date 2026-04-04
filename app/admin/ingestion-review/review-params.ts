export type QueueStatus = "pending" | "needs_review" | "validated" | "rejected";

export const STATUS_VALUES: QueueStatus[] = [
  "needs_review",
  "pending",
  "validated",
  "rejected",
];

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export function parseStatus(value: string | undefined): QueueStatus {
  if (value && STATUS_VALUES.includes(value as QueueStatus)) {
    return value as QueueStatus;
  }
  return "needs_review";
}

export function parsePage(value: string | undefined): number {
  const n = Number(value ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/** `page_size` wins; falls back to legacy `limit` query param. */
export function parsePageSize(
  pageSizeParam: string | undefined,
  legacyLimit: string | undefined,
): number {
  const raw = pageSizeParam ?? legacyLimit ?? String(DEFAULT_PAGE_SIZE);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(n));
}

export type ReviewListQuery = {
  status: QueueStatus;
  page: number;
  pageSize: number;
  dish?: string;
};

export function buildIngestionReviewUrl(q: ReviewListQuery): string {
  const u = new URLSearchParams();
  u.set("status", q.status);
  u.set("page", String(q.page));
  u.set("page_size", String(q.pageSize));
  if (q.dish?.trim()) u.set("dish", q.dish.trim().toLowerCase());
  return `/admin/ingestion-review?${u.toString()}`;
}

export function rowSummary(raw: unknown) {
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

  const canonicalSlug =
    typeof payload?.dish_slug === "string" ? payload.dish_slug : "";

  return {
    query: typeof payload?.requested_query === "string" ? payload.requested_query : "",
    nameEn: typeof mapped?.name_en === "string" ? mapped.name_en : "",
    slug: typeof mapped?.slug === "string" ? mapped.slug : "",
    canonicalSlug,
    ingredientCount: Array.isArray(mapped?.ingredients) ? mapped.ingredients.length : 0,
    confidence: typeof transform?.confidence === "string" ? transform.confidence : "",
    reasons,
  };
}

export type RowSummary = ReturnType<typeof rowSummary>;

export type PageNavItem =
  | { kind: "page"; num: number; href: string; current: boolean }
  | { kind: "ellipsis" };

export function buildPageLinks(
  q: ReviewListQuery,
  totalPages: number,
): {
  prev: string | null;
  next: string | null;
  items: PageNavItem[];
} {
  const prev =
    q.page > 1
      ? buildIngestionReviewUrl({ ...q, page: q.page - 1 })
      : null;
  const next =
    q.page < totalPages
      ? buildIngestionReviewUrl({ ...q, page: q.page + 1 })
      : null;

  const nums = new Set<number>();
  const addRange = (a: number, b: number) => {
    for (let n = a; n <= b; n++) nums.add(n);
  };
  addRange(1, Math.min(2, totalPages));
  addRange(Math.max(1, q.page - 2), Math.min(totalPages, q.page + 2));
  addRange(Math.max(1, totalPages - 1), totalPages);

  const sorted = [...nums].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const items: PageNavItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    if (i > 0 && n - sorted[i - 1]! > 1) {
      items.push({ kind: "ellipsis" });
    }
    items.push({
      kind: "page",
      num: n,
      href: buildIngestionReviewUrl({ ...q, page: n }),
      current: n === q.page,
    });
  }

  return { prev, next, items };
}
