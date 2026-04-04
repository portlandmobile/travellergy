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

const POOL_CAP = 32;

export type HomeSafetySpotlightsResult = {
  spotlights: HomeSafetySpotlight[];
  /** True when every pool item was already in the session cookie; cookie was replaced on next record. */
  sessionReset: boolean;
};

/**
 * Prefer spotlights not yet shown this session (cookie). When all are seen, reset and
 * draw from the full pool. Each visit varies the starting index; still prefers two regions when possible.
 */
function pickSpotlightsForSession(
  rows: SafetySpotlightRow[],
  count: number,
  shownIds: string[],
): { picked: SafetySpotlightRow[]; sessionReset: boolean } {
  if (rows.length === 0) return { picked: [], sessionReset: false };
  const pool = rows.slice(0, Math.min(POOL_CAP, rows.length));
  const unseen = pool.filter((r) => !shownIds.includes(r.id));
  const sessionReset = unseen.length === 0;
  const candidates = sessionReset ? pool : unseen;
  const start = Date.now() % candidates.length;
  const first = candidates[start]!;
  if (count <= 1) return { picked: [first], sessionReset };

  for (let step = 1; step < candidates.length; step++) {
    const idx = (start + step) % candidates.length;
    const candidate = candidates[idx]!;
    if (candidate.region_slug !== first.region_slug) {
      return { picked: [first, candidate], sessionReset };
    }
  }
  return {
    picked: [first, candidates[(start + 1) % candidates.length]!],
    sessionReset,
  };
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
  shownIdsThisSession: string[] = [],
): Promise<HomeSafetySpotlightsResult> {
  const mapResult = (
    picked: SafetySpotlightRow[],
    sessionReset: boolean,
  ): HomeSafetySpotlightsResult => ({
    spotlights: picked.map(toHomeSpotlight),
    sessionReset,
  });

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("safety_spotlights")
      .select("id,region_slug,title,content,category,priority,last_updated")
      .eq("is_active", true);

    if (error) {
      console.error("[safety_spotlights]", error.message);
      const { picked, sessionReset } = pickSpotlightsForSession(
        FALLBACK_SPOTLIGHTS,
        count,
        shownIdsThisSession,
      );
      return mapResult(picked, sessionReset);
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
      const { picked, sessionReset } = pickSpotlightsForSession(
        FALLBACK_SPOTLIGHTS,
        count,
        shownIdsThisSession,
      );
      return mapResult(picked, sessionReset);
    }

    const { picked, sessionReset } = pickSpotlightsForSession(
      rows,
      count,
      shownIdsThisSession,
    );
    return mapResult(picked, sessionReset);
  } catch {
    const { picked, sessionReset } = pickSpotlightsForSession(
      FALLBACK_SPOTLIGHTS,
      count,
      shownIdsThisSession,
    );
    return mapResult(picked, sessionReset);
  }
}
