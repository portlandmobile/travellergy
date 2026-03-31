"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type RegionSearchResult = {
  slug: string;
  name: string;
  country_code: string;
};

export default function RegionSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegionSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/regions/search?q=${encodeURIComponent(q)}`,
        );
        if (!response.ok) {
          setResults([]);
          return;
        }
        const data = (await response.json()) as { results?: RegionSearchResult[] };
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl"
    >
      <label
        htmlFor="region-search"
        className="mb-2 block text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/80"
      >
        Search City
      </label>
      <div className="rounded-full bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
        <input
          id="region-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: Tokyo, Seoul, Barcelona..."
          className="w-full rounded-full border border-sage/20 bg-white px-5 py-3 text-charcoal outline-none ring-0 placeholder:text-charcoal/40 focus:border-sage"
        />
      </div>
      <div className="mt-3">
        {isLoading && <p className="text-sm text-white/90">Searching...</p>}
        {!isLoading && results.length > 0 && (
          <ul className="overflow-hidden rounded-2xl border border-white/25 bg-white/95 text-charcoal shadow-xl backdrop-blur-sm">
            {results.map((item) => (
              <li key={item.slug}>
                <button
                  type="button"
                  onClick={() => router.push(`/city/${item.slug}`)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-sage/10"
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
    </motion.div>
  );
}
