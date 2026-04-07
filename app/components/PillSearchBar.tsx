"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { DiscoverySearchHit } from "@/lib/discovery-search";

export function PillSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiscoverySearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setIsLoading(false);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        setSearched(false);
        const response = await fetch(
          `/api/regions/search?q=${encodeURIComponent(q)}`,
        );
        if (!response.ok) {
          setResults([]);
          setSearched(true);
          return;
        }
        const data = (await response.json()) as {
          results?: DiscoverySearchHit[];
        };
        setResults(data.results ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  function navigateTo(hit: DiscoverySearchHit) {
    setQuery("");
    setResults([]);
    if (hit.kind === "region") {
      router.push(`/city/${hit.slug}`);
      return;
    }
    router.push(`/city/${hit.city_slug}/ecosystem/${hit.slug}`);
  }

  function resultKey(hit: DiscoverySearchHit): string {
    return hit.kind === "region"
      ? `r:${hit.slug}`
      : `e:${hit.city_slug}:${hit.slug}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative z-10 w-full max-w-md"
    >
      <label htmlFor="pill-region-search" className="sr-only">
        Search city or culinary hub
      </label>
      <div className="group relative">
        <input
          id="pill-region-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          placeholder="Try: Tokyo, Bangkok, Edo-mae sushi…"
          className="w-full rounded-full border border-transparent bg-white px-5 py-2 text-charcoal shadow-md outline-none transition-shadow placeholder:text-charcoal/40 focus:border-sage/30 focus:ring-2 focus:ring-travellergy-accent/20 group-hover:shadow-lg"
        />
        {(isLoading || results.length > 0 || (searched && query.trim())) && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-sage/20 bg-white text-left shadow-xl">
            {isLoading && (
              <p className="px-4 py-3 text-sm text-charcoal/60">Searching…</p>
            )}
            {!isLoading &&
              searched &&
              results.length === 0 &&
              query.trim() && (
                <p className="px-4 py-3 text-sm text-charcoal/60">
                  No matches. Try another spelling or search again in a moment.
                </p>
              )}
            {!isLoading && results.length > 0 && (
              <ul role="listbox" aria-label="Search results">
                {results.map((item) => (
                  <li key={resultKey(item)} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => navigateTo(item)}
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-charcoal transition-colors hover:bg-sage/10"
                    >
                      <span>
                        <span className="font-medium">{item.name}</span>
                        {item.kind === "ecosystem" && item.name_local && (
                          <span className="mt-0.5 block text-xs text-charcoal/60">
                            {item.name_local}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full bg-sage/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sage">
                        {item.kind === "ecosystem" ? "Hub" : item.country_code}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
