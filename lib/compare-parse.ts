const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/** Parse up to 3 unique, safe region slugs from comma-separated query value. */
export function parseCompareCitySlugs(param: string | undefined): string[] {
  if (!param?.trim()) return [];
  const parts = param
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (!SLUG_RE.test(p) || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= 3) break;
  }
  return out;
}

export function compareQueryString(slugs: string[]): string {
  if (slugs.length === 0) return "/compare";
  return `/compare?cities=${slugs.map(encodeURIComponent).join(",")}`;
}
