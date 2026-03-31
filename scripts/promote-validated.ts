import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

function normalizeEnvValue(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function required(name: string): string {
  const value = normalizeEnvValue(process.env[name]);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function parseArg(prefix: string): string | null {
  const token = process.argv.find((a) => a.startsWith(`${prefix}=`));
  return token ? token.split("=")[1] ?? null : null;
}

function hasFlag(name: string): boolean {
  return process.argv.some((a) => a === name || a.startsWith(`${name}=`));
}

function parseLimit(): number | null {
  const raw = parseArg("--limit");
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid --limit="${raw}" (expected positive integer)`);
  }
  return n;
}

type RawIngredient = {
  name?: unknown;
  is_hidden?: unknown;
  allergen_risk?: unknown;
};

type RawDish = {
  name_en?: unknown;
  name_local?: unknown;
  slug?: unknown;
  description?: unknown;
  is_common_allergen_risk?: unknown;
  ingredients?: unknown;
};

type StagingRow = {
  id: number;
  raw_data: Record<string, unknown> | null;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapRisk(v: unknown): "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" {
  const s = asString(v).toUpperCase();
  if (s === "HIGH" || s === "MEDIUM" || s === "LOW") return s;
  return "UNKNOWN";
}

function extractDish(rawData: Record<string, unknown>): RawDish | null {
  const transform = rawData.transform;
  if (transform && typeof transform === "object") {
    const dish = (transform as Record<string, unknown>).dish;
    if (dish && typeof dish === "object") return dish as RawDish;
  }
  const mapped = rawData.mapped;
  if (mapped && typeof mapped === "object") return mapped as RawDish;
  return null;
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const limit = parseLimit();
  const regionSlugFilter = asString(parseArg("--region")).toLowerCase();

  console.log(
    `[promote] status=validated dry_run=${dryRun} region=${regionSlugFilter || "all"} limit=${limit ?? "none"}`,
  );

  const supabase = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  let query = supabase
    .schema("staging")
    .from("ingestion_raw")
    .select("id,raw_data")
    .eq("status", "validated")
    .order("id", { ascending: true });

  if (regionSlugFilter) {
    query = query.contains("raw_data", { region_slug: regionSlugFilter });
  }
  if (limit != null) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load staging rows: ${error.message}`);

  const rows = ((data ?? []) as unknown[]).filter(Boolean) as StagingRow[];
  console.log(`[promote] candidate_rows=${rows.length}`);

  let promoted = 0;
  let skipped = 0;
  let failed = 0;
  let ingredientLinks = 0;

  const regionIdCache = new Map<string, string>();
  const ingredientIdCache = new Map<string, string>();

  for (const row of rows) {
    try {
      const rawData = row.raw_data;
      if (!rawData || typeof rawData !== "object") {
        skipped += 1;
        console.log(`[skip] row=${row.id} missing raw_data`);
        continue;
      }

      const dish = extractDish(rawData);
      if (!dish) {
        skipped += 1;
        console.log(`[skip] row=${row.id} missing mapped/transform dish payload`);
        continue;
      }

      const nameEn = asString(dish.name_en);
      const nameLocal = asString(dish.name_local) || nameEn;
      const slug = asString(dish.slug);
      if (!nameEn || !nameLocal || !slug) {
        skipped += 1;
        console.log(`[skip] row=${row.id} incomplete dish fields`);
        continue;
      }

      const description = asString(dish.description);
      const commonRisk = asBool(dish.is_common_allergen_risk, false);

      const rawDishId = asString(rawData.dish_id);
      const rawRegionSlug = asString(rawData.region_slug).toLowerCase();

      if (dryRun) {
        console.log(
          `[dry-run] row=${row.id} dish=${slug} dish_id=${rawDishId || "none"} region=${rawRegionSlug || "none"}`,
        );
        promoted += 1;
        continue;
      }

      let dishId: string | null = null;
      if (rawDishId) {
        const { data: upserted, error: upsertErr } = await supabase
          .from("dishes")
          .upsert(
            {
              id: rawDishId,
              name_en: nameEn,
              name_local: nameLocal,
              slug,
              description,
              is_common_allergen_risk: commonRisk,
            },
            { onConflict: "id" },
          )
          .select("id")
          .single();
        if (upsertErr) throw new Error(`dishes upsert by id failed: ${upsertErr.message}`);
        dishId = upserted.id as string;
      } else {
        const { data: upserted, error: upsertErr } = await supabase
          .from("dishes")
          .upsert(
            {
              name_en: nameEn,
              name_local: nameLocal,
              slug,
              description,
              is_common_allergen_risk: commonRisk,
            },
            { onConflict: "slug" },
          )
          .select("id")
          .single();
        if (upsertErr) throw new Error(`dishes upsert by slug failed: ${upsertErr.message}`);
        dishId = upserted.id as string;
      }

      const ingredients = Array.isArray(dish.ingredients)
        ? (dish.ingredients as RawIngredient[])
        : [];
      for (const ing of ingredients) {
        const ingredientName = normalizeIngredientName(asString(ing.name));
        if (!ingredientName) continue;

        let ingredientId = ingredientIdCache.get(ingredientName) ?? null;
        if (!ingredientId) {
          const { data: ingRow, error: ingErr } = await supabase
            .from("ingredients")
            .upsert(
              {
                name: ingredientName,
                risk_level: mapRisk(ing.allergen_risk),
              },
              { onConflict: "name" },
            )
            .select("id")
            .single();
          if (ingErr) throw new Error(`ingredients upsert failed: ${ingErr.message}`);
          ingredientId = ingRow.id as string;
          ingredientIdCache.set(ingredientName, ingredientId);
        }

        const { error: linkErr } = await supabase
          .from("dish_ingredients")
          .upsert(
            {
              dish_id: dishId,
              ingredient_id: ingredientId,
              is_hidden_ingredient: asBool(ing.is_hidden, false),
            },
            { onConflict: "dish_id,ingredient_id" },
          );
        if (linkErr) throw new Error(`dish_ingredients upsert failed: ${linkErr.message}`);
        ingredientLinks += 1;
      }

      if (rawRegionSlug) {
        let regionId = regionIdCache.get(rawRegionSlug) ?? null;
        if (!regionId) {
          const { data: regionRow, error: regionErr } = await supabase
            .from("regions")
            .select("id")
            .eq("slug", rawRegionSlug)
            .maybeSingle();
          if (regionErr) throw new Error(`region lookup failed: ${regionErr.message}`);
          regionId = (regionRow?.id as string | undefined) ?? null;
          if (regionId) regionIdCache.set(rawRegionSlug, regionId);
        }
        if (regionId) {
          const { error: mapErr } = await supabase
            .from("region_dish_mapping")
            .upsert(
              {
                region_id: regionId,
                dish_id: dishId,
                prevalence: "UNKNOWN",
                notes: `Hydrated from staging.ingestion_raw id=${row.id}`,
              },
              {
                onConflict: "region_id,dish_id",
                ignoreDuplicates: true,
              },
            );
          if (mapErr) throw new Error(`region_dish_mapping upsert failed: ${mapErr.message}`);
        }
      }

      promoted += 1;
      console.log(`[ ok ] row=${row.id} dish=${slug} ingredients=${ingredients.length}`);
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[fail] row=${row.id}: ${message}`);
    }
  }

  console.log(
    `[summary] promoted=${promoted} skipped=${skipped} failed=${failed} ingredient_links=${ingredientLinks} dry_run=${dryRun}`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[fatal] ${message}`);
  process.exit(1);
});

