"use client";

import { useEffect, useState } from "react";
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
    <div className="w-full max-w-xl">
      <label htmlFor="region-search" className="mb-2 block text-sm font-medium">
        Search city
      </label>
      <input
        id="region-search"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try: Barc"
        className="w-full rounded-md border border-black/20 px-3 py-2 text-black outline-none focus:border-black"
      />
      <div className="mt-2">
        {isLoading && <p className="text-sm text-black/70">Searching...</p>}
        {!isLoading && results.length > 0 && (
          <ul className="rounded-md border border-black/10 bg-white">
            {results.map((item) => (
              <li key={item.slug}>
                <button
                  type="button"
                  onClick={() => router.push(`/city/${item.slug}`)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-black/5"
                >
                  <span>{item.name}</span>
                  <span className="text-xs text-black/60">{item.country_code}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
