/** Session cookie: spotlight row ids already shown this browser session. */
export const SAFETY_SPOTLIGHT_SEEN_COOKIE = "travellergy_ss_seen";

export function parseSafetySpotlightSeenCookie(
  raw: string | undefined,
): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

/** Returns JSON cookie payload, or `null` when there is nothing to persist. */
export function buildSafetySpotlightSeenCookieValue(args: {
  previousRaw: string | undefined;
  ids: string[];
  replaceAll: boolean;
}): string | null {
  const unique = [...new Set(args.ids.filter((id) => id.length > 0))];
  if (unique.length === 0) return null;
  if (args.replaceAll) {
    return JSON.stringify(unique);
  }
  const prev = parseSafetySpotlightSeenCookie(args.previousRaw);
  return JSON.stringify([...new Set([...prev, ...unique])]);
}
