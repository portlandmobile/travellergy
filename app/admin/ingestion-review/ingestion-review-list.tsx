"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { decide, decideBulk } from "./actions";
import {
  buildIngestionReviewUrl,
  MAX_PAGE_SIZE,
  type PageNavItem,
  type ReviewListQuery,
  type RowSummary,
} from "./review-params";

export type RowDTO = {
  id: number;
  source_name: string;
  status: string;
  created_at: string | null;
  summary: RowSummary;
};

type Props = {
  rows: RowDTO[];
  queueQuery: ReviewListQuery;
  totalCount: number;
  totalPages: number;
  nav: {
    prev: string | null;
    next: string | null;
    items: PageNavItem[];
  };
};

const PAGE_SIZE_CHOICES = [10, 25, 50, 100] as const;

function pageSizeSelectValues(current: number): number[] {
  return [...new Set([...PAGE_SIZE_CHOICES, current])].sort((a, b) => a - b);
}

function BulkActionButtons({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  return (
    <>
      <button
        type="submit"
        name="decision"
        value="accepted"
        disabled={isDisabled}
        className="rounded border border-green-700 px-2 py-1 text-xs text-green-800 disabled:opacity-40"
      >
        {pending ? "Processing..." : "Accept selected"}
      </button>
      <button
        type="submit"
        name="decision"
        value="rejected"
        disabled={isDisabled}
        className="rounded border border-red-700 px-2 py-1 text-xs text-red-800 disabled:opacity-40"
      >
        {pending ? "Processing..." : "Reject selected"}
      </button>
      <button
        type="submit"
        name="decision"
        value="flagged"
        disabled={isDisabled}
        className="rounded border border-black/30 px-2 py-1 text-xs text-black disabled:opacity-40"
      >
        {pending ? "Processing..." : "Keep flagged"}
      </button>
    </>
  );
}

function RowActionButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="submit"
        name="decision"
        value="accepted"
        disabled={pending}
        className="rounded border border-green-700 px-3 py-1 text-sm text-green-800 disabled:opacity-40"
      >
        {pending ? "Saving..." : "Accept"}
      </button>
      <button
        type="submit"
        name="decision"
        value="rejected"
        disabled={pending}
        className="rounded border border-red-700 px-3 py-1 text-sm text-red-800 disabled:opacity-40"
      >
        {pending ? "Saving..." : "Reject"}
      </button>
      <button
        type="submit"
        name="decision"
        value="flagged"
        disabled={pending}
        className="rounded border border-black/30 px-3 py-1 text-sm text-black disabled:opacity-40"
      >
        {pending ? "Saving..." : "Keep Flagged"}
      </button>
      {pending ? (
        <span className="text-xs text-black/60" role="status" aria-live="polite">
          Updating row...
        </span>
      ) : null}
    </div>
  );
}

export function IngestionReviewList({
  rows,
  queueQuery,
  totalCount,
  totalPages,
  nav,
}: Props) {
  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelected(new Set());
  }, [queueQuery.page, queueQuery.pageSize, queueQuery.status, queueQuery.dish]);

  const allOnPageSelected =
    rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someOnPageSelected = rowIds.some((id) => selected.has(id));

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = someOnPageSelected && !allOnPageSelected;
  }, [allOnPageSelected, someOnPageSelected]);

  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    if (allOnPageSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rowIds));
    }
  };

  const selectedArray = Array.from(selected);
  const hiddenListJson = JSON.stringify(selectedArray);

  const baseQuery: ReviewListQuery = queueQuery;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-black/10 bg-white px-3 py-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allOnPageSelected}
            onChange={toggleSelectAllPage}
            className="h-4 w-4 rounded border-black/30"
            aria-label="Select all rows on this page"
          />
          <span className="text-black/80">
            Select all on page ({rowIds.length})
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-black/60">
            {selectedArray.length} selected
          </span>
          <form action={decideBulk} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="status" value={queueQuery.status} />
            <input type="hidden" name="page" value={String(queueQuery.page)} />
            <input type="hidden" name="page_size" value={String(queueQuery.pageSize)} />
            {queueQuery.dish ? (
              <input type="hidden" name="dish" value={queueQuery.dish} />
            ) : null}
            <input type="hidden" name="row_ids" value={hiddenListJson} readOnly />
            <input
              name="bulk_reason"
              placeholder="Optional reason (applies to all)"
              className="min-w-[12rem] rounded border border-black/20 px-2 py-1 text-xs"
            />
            <BulkActionButtons disabled={selectedArray.length === 0} />
          </form>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/70">
        <p className="text-xs">
          Page {queueQuery.page} of {totalPages} · {totalCount} total ·{" "}
          {queueQuery.pageSize} per page
        </p>
        <label className="flex items-center gap-2 text-xs">
          <span>Rows per page</span>
          <select
            className="rounded border border-black/20 px-2 py-1 text-black"
            value={String(queueQuery.pageSize)}
            onChange={(e) => {
              const pageSize = Number(e.target.value);
              const href = buildIngestionReviewUrl({
                ...baseQuery,
                page: 1,
                pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize)),
              });
              window.location.href = href;
            }}
          >
            {pageSizeSelectValues(queueQuery.pageSize).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Pagination">
        {nav.prev ? (
          <a
            href={nav.prev}
            className="rounded border border-black/20 px-2 py-1 text-black hover:bg-black/5"
          >
            Previous
          </a>
        ) : (
          <span className="rounded border border-black/10 px-2 py-1 text-black/35">
            Previous
          </span>
        )}
        {nav.items.map((item, i) =>
          item.kind === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1 text-black/50">
              …
            </span>
          ) : (
            <a
              key={item.num}
              href={item.href}
              className={`min-w-[2rem] rounded border px-2 py-1 text-center ${
                item.current
                  ? "border-black bg-black text-white"
                  : "border-black/20 text-black hover:bg-black/5"
              }`}
            >
              {item.num}
            </a>
          ),
        )}
        {nav.next ? (
          <a
            href={nav.next}
            className="rounded border border-black/20 px-2 py-1 text-black hover:bg-black/5"
          >
            Next
          </a>
        ) : (
          <span className="rounded border border-black/10 px-2 py-1 text-black/35">
            Next
          </span>
        )}
      </nav>

      <div className="space-y-3">
        {rows.map((row) => {
          const summary = row.summary;
          const checked = selected.has(row.id);
          return (
            <article
              key={row.id}
              className="space-y-3 rounded border border-black/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-start gap-3">
                <label className="flex cursor-pointer items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRow(row.id)}
                    className="h-4 w-4 rounded border-black/30"
                    aria-label={`Select row ${row.id}`}
                  />
                </label>
                <div className="min-w-0 flex-1 space-y-3">
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
                    <p>
                      canonical dish_slug: {summary.canonicalSlug || "-"}{" "}
                      <span className="text-black/50">
                        · mapped slug: {summary.slug || "-"}
                      </span>
                    </p>
                    <p>ingredients: {summary.ingredientCount}</p>
                    <p>confidence: {summary.confidence || "-"}</p>
                    <p>
                      reasons:{" "}
                      {summary.reasons.length > 0 ? summary.reasons.join(", ") : "-"}
                    </p>
                  </div>

                  <form action={decide} className="space-y-2">
                    <input type="hidden" name="row_id" value={row.id} />
                    <input type="hidden" name="status" value={queueQuery.status} />
                    <input type="hidden" name="page" value={String(queueQuery.page)} />
                    <input type="hidden" name="page_size" value={String(queueQuery.pageSize)} />
                    {queueQuery.dish ? (
                      <input type="hidden" name="dish" value={queueQuery.dish} />
                    ) : null}
                    <input
                      name="reason"
                      placeholder="Optional reason"
                      className="w-full rounded border border-black/20 px-2 py-1 text-sm"
                    />
                    <RowActionButtons />
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
