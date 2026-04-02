/**
 * Edamam Recipe Search API v2 — fetch public recipes and map to Dish-shaped payload.
 * @see https://developer.edamam.com/edamam-docs-recipe-api
 */

import { IngestionSourceSchema, type IngestionSource } from "../schema";
import { runWithEdamamRateLimit } from "./edamam-rate-limit";

type EdamamRecipe = {
  uri?: string;
  label?: string;
  source?: string;
  /** Present on many v2 search hits. */
  ingredientLines?: string[];
  /** Alternate shape: array of `{ text: "1 cup …" }` (also used on site). */
  ingredients?: Array<{ text?: string } | string>;
  summary?: string;
};

type EdamamRecipeHit = {
  recipe?: EdamamRecipe;
};

type EdamamSearchResponse = {
  hits?: EdamamRecipeHit[];
  count?: number;
};

type EdamamFetchOutcome =
  | { kind: "ok"; res: Response; raw: EdamamSearchResponse }
  | { kind: "rate_limited"; res: Response; raw: unknown };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse Retry-After as seconds or HTTP-date. */
function retryAfterMs(headers: Headers): number | null {
  const v = headers.get("retry-after")?.trim();
  if (!v) return null;
  const asNum = Number(v);
  if (Number.isFinite(asNum) && asNum >= 0) {
    return Math.min(120_000, asNum * 1000);
  }
  const when = Date.parse(v);
  if (Number.isFinite(when)) {
    return Math.min(120_000, Math.max(0, when - Date.now()));
  }
  return null;
}

function backoffMsFor429(attemptIndex: number): number {
  const base = Math.min(60_000, 2000 * 2 ** attemptIndex);
  const jitter = Math.floor(Math.random() * 750);
  return base + jitter;
}

function edamam429MaxAttempts(): number {
  const n = Number(process.env.EDAMAM_429_MAX_ATTEMPTS ?? "6");
  if (!Number.isFinite(n) || n < 1) return 6;
  return Math.min(12, Math.floor(n));
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

const ALLERGEN_HINT =
  /shellfish|shrimp|crab|lobster|mussel|oyster|peanut|tree nut|almond|walnut|dairy|milk|cheese|butter|egg|fish|soy|sesame|gluten|wheat/i;

function inferAllergenRiskFromLine(line: string): "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" {
  if (ALLERGEN_HINT.test(line)) return "HIGH";
  return "UNKNOWN";
}

function inferDishRisk(lines: string[]): boolean {
  const blob = lines.join(" ");
  return ALLERGEN_HINT.test(blob);
}

/**
 * Edamam search may return `ingredientLines` or only `ingredients[].text`.
 * Use both so we don’t store empty lists when the site shows ingredients.
 */
function extractIngredientLines(recipe: EdamamRecipe): string[] {
  const fromLines = recipe.ingredientLines;
  if (Array.isArray(fromLines) && fromLines.length > 0) {
    return fromLines.map((l) => String(l).trim()).filter(Boolean);
  }
  const raw = recipe.ingredients;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t) out.push(t);
      continue;
    }
    if (item && typeof item === "object" && "text" in item) {
      const t = String((item as { text?: string }).text ?? "").trim();
      if (t) out.push(t);
    }
  }
  return out;
}

export type EdamamFetchResult = {
  /** Payload suitable for transformAndValidate / DishSchema. */
  mapped: Record<string, unknown>;
  /** Full Edamam JSON response. */
  raw: unknown;
  source: IngestionSource;
};

export class EdamamAdapter {
  private readonly appId: string;
  private readonly appKey: string;

  constructor() {
    this.appId = requireEnv("EDAMAM_APP_ID");
    this.appKey = requireEnv("EDAMAM_APP_KEY");
  }

  /**
   * Search public recipes and map the first hit into a dish-like object.
   * Returns raw API payload for staging.ingestion_raw.
   */
  async searchFirstDish(query: string): Promise<EdamamFetchResult> {
    const q = query.trim();
    if (!q) throw new Error("Edamam search query is empty");

    const maxAttempts = edamam429MaxAttempts();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const outcome = await runWithEdamamRateLimit(async (): Promise<EdamamFetchOutcome> => {
        const url = new URL("https://api.edamam.com/api/recipes/v2");
        url.searchParams.set("type", "public");
        url.searchParams.set("q", q);
        url.searchParams.set("app_id", this.appId);
        url.searchParams.set("app_key", this.appKey);

        const res = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
        });

        const raw = (await res.json()) as EdamamSearchResponse;
        if (res.status === 429) {
          return { kind: "rate_limited", res, raw };
        }
        return { kind: "ok", res, raw };
      });

      if (outcome.kind === "rate_limited") {
        const raw = outcome.raw;
        const msg =
          typeof raw === "object" && raw !== null && "message" in raw
            ? String((raw as { message?: string }).message)
            : outcome.res.statusText;
        if (attempt >= maxAttempts - 1) {
          throw new Error(
            `Edamam API error 429 after ${maxAttempts} attempts: ${msg}`,
          );
        }
        const waitMs =
          retryAfterMs(outcome.res.headers) ?? backoffMsFor429(attempt);
        console.warn(
          `[edamam] 429 — waiting ${waitMs}ms then retry ${attempt + 2}/${maxAttempts} (${msg})`,
        );
        await sleep(waitMs);
        continue;
      }

      const { res, raw } = outcome;
      if (!res.ok) {
        const msg =
          typeof raw === "object" && raw !== null && "message" in raw
            ? String((raw as { message?: string }).message)
            : res.statusText;
        throw new Error(`Edamam API error ${res.status}: ${msg}`);
      }

      const recipe = raw.hits?.[0]?.recipe;
      const label = recipe?.label?.trim() ?? "";
      if (!recipe || !label) {
        const mapped = {
          name_en: "",
          name_local: "",
          slug: "",
          description: "",
          is_common_allergen_risk: false,
          ingredients: [] as {
            name: string;
            is_hidden: boolean;
            allergen_risk: string;
          }[],
        };
        const source = IngestionSourceSchema.parse({
          source_name: "edamam_recipe_v2",
          source_api_version: "v2",
          fetched_at: new Date().toISOString(),
        });
        return { mapped, raw, source };
      }

      const lines = extractIngredientLines(recipe);
      const ingredients = lines.map((line) => ({
        name: line.trim(),
        is_hidden: false,
        allergen_risk: inferAllergenRiskFromLine(line),
      }));

      const slug = slugifyLabel(label);
      const safeSlug = slug.length > 0 ? slug : "recipe";

      const mapped = {
        name_en: label,
        name_local: label,
        slug: safeSlug,
        description: (recipe.summary ?? "")
          .replace(/<[^>]+>/g, "")
          .trim()
          .slice(0, 2000),
        is_common_allergen_risk: inferDishRisk(lines),
        ingredients,
      };

      const source = IngestionSourceSchema.parse({
        source_name: "edamam_recipe_v2",
        source_api_version: "v2",
        external_id: recipe.uri,
        external_uri: recipe.uri,
        fetched_at: new Date().toISOString(),
      });

      return { mapped, raw, source };
    }

    throw new Error("Edamam search exhausted retries unexpectedly");
  }
}
