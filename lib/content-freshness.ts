export type FreshnessState =
  | { kind: "unknown" }
  | { kind: "fresh"; daysAgo: number }
  | { kind: "stale"; daysAgo: number };

function parseUpdatedAt(): Date | null {
  const raw =
    typeof process.env.NEXT_PUBLIC_DATA_UPDATED_AT === "string"
      ? process.env.NEXT_PUBLIC_DATA_UPDATED_AT.trim()
      : "";
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function staleAfterDays(): number {
  const n = Number(process.env.NEXT_PUBLIC_DATA_STALE_AFTER_DAYS ?? "180");
  return Number.isFinite(n) && n > 0 ? n : 180;
}

export function getContentFreshness(): FreshnessState {
  const updatedAt = parseUpdatedAt();
  if (!updatedAt) return { kind: "unknown" };

  const daysAgo = Math.floor(
    (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const threshold = staleAfterDays();
  if (daysAgo > threshold) return { kind: "stale", daysAgo };
  return { kind: "fresh", daysAgo };
}

/** Human-readable label for the badge (wireframe-aligned wording). */
export function freshnessLabel(state: FreshnessState): string {
  if (state.kind === "unknown") return "Updated date unavailable";

  if (state.daysAgo <= 0) return "Updated today";
  if (state.daysAgo === 1) return "Updated 1 day ago";
  if (state.daysAgo < 7) return `Updated ${state.daysAgo} days ago`;
  if (state.daysAgo < 14) return "Updated 1 week ago";
  if (state.daysAgo < 30) {
    const w = Math.floor(state.daysAgo / 7);
    return `Updated ${w} weeks ago`;
  }
  if (state.daysAgo < 60) return "Updated 1 month ago";
  if (state.daysAgo < staleAfterDays()) {
    const m = Math.floor(state.daysAgo / 30);
    return `Updated ${m} months ago`;
  }
  return "Updated over 6 months ago";
}

export function isStaleState(state: FreshnessState): boolean {
  return state.kind === "stale";
}
