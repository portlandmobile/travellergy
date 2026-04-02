import { getSupabaseServerClient } from "@/lib/supabase-server";
import { spotlightImageForRegion } from "@/lib/safety-spotlight-assets";

export type SafetySpotlightCategory = "Risk" | "Tip" | "Phrase";

function normalizeCategory(raw: string): SafetySpotlightCategory {
  if (raw === "Risk" || raw === "Tip" || raw === "Phrase") return raw;
  return "Tip";
}

export type SafetySpotlightRow = {
  id: string;
  region_slug: string;
  title: string;
  content: string;
  category: SafetySpotlightCategory;
  priority: number;
  last_updated: string;
};

export type HomeSafetySpotlight = SafetySpotlightRow & {
  regionLabel: string;
  imageSrc: string;
  href: string;
};

const REGION_LABELS: Record<string, string> = {
  tokyo: "Tokyo",
  bangkok: "Bangkok",
  delhi: "Delhi",
  nyc: "New York City",
};

/** Stable per UTC day so the pair rotates without changing on every request. */
function dayBucketUtc(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/**
 * Pick up to `count` spotlights: priority-first, then rotate through the top pool
 * and prefer two different regions when possible (FR-09 / intelligent rotation).
 */
function pickSpotlightsForHome(
  rows: SafetySpotlightRow[],
  count: number,
): SafetySpotlightRow[] {
  if (rows.length === 0) return [];
  const pool = rows.slice(0, Math.min(16, rows.length));
  const bucket = dayBucketUtc();
  const start = bucket % pool.length;
  const first = pool[start]!;
  if (count <= 1) return [first];

  for (let step = 1; step < pool.length; step++) {
    const idx = (start + step) % pool.length;
    const candidate = pool[idx]!;
    if (candidate.region_slug !== first.region_slug) {
      return [first, candidate];
    }
  }
  return [first, pool[(start + 1) % pool.length]!];
}

const FALLBACK_SPOTLIGHTS: SafetySpotlightRow[] = [
  {
    id: "fallback-1",
    region_slug: "bangkok",
    title: "Nam Pla risk",
    content:
      "Fish sauce is in most local dishes. It is a leading source of undeclared seafood allergens—always ask before you eat.",
    category: "Risk",
    priority: 5,
    last_updated: new Date(0).toISOString(),
  },
  {
    id: "fallback-2",
    region_slug: "tokyo",
    title: 'The hidden dashi',
    content:
      'Many "vegetable" soups use bonito (fish) dashi. Ask: "Dashi wa sakana desu ka?" (Is the dashi fish-based?).',
    category: "Risk",
    priority: 5,
    last_updated: new Date(0).toISOString(),
  },
];

function toHomeSpotlight(row: SafetySpotlightRow): HomeSafetySpotlight {
  const regionLabel =
    REGION_LABELS[row.region_slug] ??
    row.region_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    ...row,
    regionLabel,
    imageSrc: spotlightImageForRegion(row.region_slug),
    href: `/city/${encodeURIComponent(row.region_slug)}`,
  };
}

export async function getHomeSafetySpotlights(
  count = 2,
): Promise<HomeSafetySpotlight[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("safety_spotlights")
      .select("id,region_slug,title,content,category,priority,last_updated")
      .eq("is_active", true);

    if (error) {
      console.error("[safety_spotlights]", error.message);
      return pickSpotlightsForHome(FALLBACK_SPOTLIGHTS, count).map(
        toHomeSpotlight,
      );
    }

    const rows = ((data ?? []) as SafetySpotlightRow[]).map((row) => ({
      ...row,
      category: normalizeCategory(row.category),
    })).sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return (
        new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      );
    });
    if (rows.length === 0) {
      return pickSpotlightsForHome(FALLBACK_SPOTLIGHTS, count).map(
        toHomeSpotlight,
      );
    }

    return pickSpotlightsForHome(rows, count).map(toHomeSpotlight);
  } catch {
    return pickSpotlightsForHome(FALLBACK_SPOTLIGHTS, count).map(
      toHomeSpotlight,
    );
  }
}
