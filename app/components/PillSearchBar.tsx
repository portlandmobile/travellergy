"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type RegionSearchResult = {
  slug: string;
  name: string;
  country_code: string;
};

export function PillSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegionSearchResult[]>([]);
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
        const data = (await response.json()) as { results?: RegionSearchResult[] };
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative z-10 w-full max-w-md"
    >
      <label htmlFor="pill-region-search" className="sr-only">
        Search city
      </label>
      <div className="group relative">
        <input
          id="pill-region-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          placeholder="Try: Tokyo, Bangkok, New York…"
          className="w-full rounded-full border border-transparent bg-white px-6 py-3 text-charcoal shadow-md outline-none transition-shadow placeholder:text-charcoal/40 focus:border-sage/30 focus:ring-2 focus:ring-travellergy-accent/20 group-hover:shadow-lg"
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
                  No cities found. Try another spelling, or search again in a
                  moment.
                </p>
              )}
            {!isLoading && results.length > 0 && (
              <ul role="listbox" aria-label="City results">
                {results.map((item) => (
                  <li key={item.slug} role="option">
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                        router.push(`/city/${item.slug}`);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-charcoal transition-colors hover:bg-sage/10"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="rounded-full bg-sage/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sage">
                        {item.country_code}
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
