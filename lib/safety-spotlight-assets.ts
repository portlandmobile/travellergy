/**
 * Static 16:9 SVG heroes in `public/images/safety-spotlights/` (git-tracked).
 * Safety-forward art: city name, warning motif, subtle chart bars — not stock travel photos.
 */
const BASE = "/images/safety-spotlights";

export const SAFETY_SPOTLIGHT_IMAGE_BY_REGION: Record<string, string> = {
  tokyo: `${BASE}/tokyo.svg`,
  bangkok: `${BASE}/bangkok.svg`,
  delhi: `${BASE}/delhi.svg`,
  nyc: `${BASE}/nyc.svg`,
};

export const SAFETY_SPOTLIGHT_FALLBACK_IMAGE = `${BASE}/default.svg`;

export function spotlightImageForRegion(regionSlug: string): string {
  return (
    SAFETY_SPOTLIGHT_IMAGE_BY_REGION[regionSlug] ??
    SAFETY_SPOTLIGHT_FALLBACK_IMAGE
  );
}

export function isSafetySpotlightVectorAsset(src: string): boolean {
  return src.endsWith(".svg");
}
