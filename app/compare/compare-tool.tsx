"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { compareQueryString } from "@/lib/compare-parse";
import type { RegionDishRiskLevel } from "@/lib/regions-dishes";

type Dish = {
  slug: string;
  name_en: string;
  prevalence: string;
  risk_level: RegionDishRiskLevel;
};

export type CompareColumn =
  | { slug: string; name: string; dishes: Dish[] }
  | { slug: string; error: "not_found" | "load_error" };

type SearchHit = { slug: string; name: string; country_code: string };

function formatPrevalence(p: string): string {
  if (!p) return "—";
  return p.charAt(0) + p.slice(1).toLowerCase();
}

export default function CompareTool({
  slugs,
  columns,
}: {
  slugs: string[];
  columns: CompareColumn[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/regions/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          setHits([]);
          return;
        }
        const data = (await res.json()) as { results?: SearchHit[] };
        setHits(data.results ?? []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const navigateSlugs = useCallback(
    (next: string[]) => {
      router.push(compareQueryString(next));
    },
    [router],
  );

  const addCity = (slug: string) => {
    if (slugs.length >= 3 || slugs.includes(slug)) return;
    navigateSlugs([...slugs, slug]);
    setQuery("");
    setHits([]);
  };

  const removeCity = (slug: string) => {
    navigateSlugs(slugs.filter((s) => s !== slug));
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const dishRows: { slug: string; name_en: string }[] = [];
  const seen = new Set<string>();
  for (const col of columns) {
    if (!("dishes" in col)) continue;
    for (const d of col.dishes) {
      if (seen.has(d.slug)) continue;
      seen.add(d.slug);
      dishRows.push({ slug: d.slug, name_en: d.name_en });
    }
  }
  dishRows.sort((a, b) => a.name_en.localeCompare(b.name_en));

  return (
    <div className="w-full max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Compare cities</h2>
          <p className="mt-1 text-sm text-black/70">
            Add up to three cities. The URL updates so you can share your comparison.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyShareUrl}
            className="rounded-md border border-black/20 px-3 py-2 text-sm font-medium hover:bg-black/5"
          >
            {copyDone ? "Copied!" : "Copy share link"}
          </button>
          <Link
            href="/"
            className="rounded-md border border-black/20 px-3 py-2 text-sm font-medium hover:bg-black/5"
          >
            Home
          </Link>
        </div>
      </div>

      <section className="space-y-3 rounded-lg border border-black/10 p-4">
        <h3 className="text-sm font-medium">Add city</h3>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city…"
          disabled={slugs.length >= 3}
          className="w-full max-w-md rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:border-black disabled:opacity-50"
        />
        {searching && <p className="text-xs text-black/60">Searching…</p>}
        {hits.length > 0 && (
          <ul className="max-w-md rounded-md border border-black/10 bg-white">
            {hits.map((h) => (
              <li key={h.slug}>
                <button
                  type="button"
                  disabled={slugs.includes(h.slug) || slugs.length >= 3}
                  onClick={() => addCity(h.slug)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-40"
                >
                  <span>{h.name}</span>
                  <span className="text-xs text-black/50">{h.country_code}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {slugs.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {slugs.map((slug) => {
            const col = columns.find((c) => c.slug === slug);
            const label =
              col && "name" in col ? col.name : slug;
            return (
            <span
              key={slug}
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-3 py-1 text-sm"
            >
              <Link href={`/city/${slug}`} className="underline">
                {label}
              </Link>
              <button
                type="button"
                aria-label={`Remove ${slug}`}
                onClick={() => removeCity(slug)}
                className="text-black/50 hover:text-black"
              >
                ×
              </button>
            </span>
            );
          })}
        </section>
      )}

      {slugs.length === 0 ? (
        <p className="text-sm text-black/70">Add at least one city to see a comparison.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/[0.03]">
                <th className="px-3 py-2 text-left font-medium">Dish</th>
                {columns.map((col) => (
                  <th key={col.slug} className="px-3 py-2 text-left font-medium">
                    {"name" in col ? col.name : col.slug}
                    {"error" in col && (
                      <span className="ml-1 text-xs font-normal text-red-600">
                        ({col.error === "not_found" ? "not found" : "error"})
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dishRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-3 py-4 text-black/60"
                  >
                    No overlapping dish data to compare yet.
                  </td>
                </tr>
              ) : (
                dishRows.map((row) => (
                  <tr key={row.slug} className="border-b border-black/5">
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/dishes/${row.slug}`} className="underline">
                        {row.name_en}
                      </Link>
                    </td>
                    {columns.map((col) => {
                      if ("error" in col) {
                        return (
                          <td key={col.slug} className="px-3 py-2 text-black/40">
                            —
                          </td>
                        );
                      }
                      const d = col.dishes.find((x) => x.slug === row.slug);
                      return (
                        <td key={col.slug} className="px-3 py-2">
                          {d ? (
                            <span className="text-black/80">
                              {formatPrevalence(d.prevalence)}
                              <span className="ml-1 text-xs text-black/50">
                                ({d.risk_level})
                              </span>
                            </span>
                          ) : (
                            <span className="text-black/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
