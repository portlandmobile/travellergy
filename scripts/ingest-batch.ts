import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { EdamamAdapter } from "../lib/pipeline/adapters/edamam";
import { transformAndValidate } from "../lib/pipeline/transformer";

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

/** Optional extra pacing before each Edamam call (ms). */
function parsePacingMs(): { minMs: number; jitterMs: number } {
  const cliMin = parseArg("--sleep-ms");
  const cliJitter = parseArg("--sleep-jitter-ms");
  const envMin = Number(process.env.EDAMAM_BATCH_MIN_SLEEP_MS ?? "0");
  const envJitter = Number(process.env.EDAMAM_BATCH_SLEEP_JITTER_MS ?? "0");

  const minMs =
    cliMin != null && cliMin !== ""
      ? Number.parseInt(cliMin, 10)
      : Number.isFinite(envMin)
        ? Math.floor(envMin)
        : 0;
  const jitterMs =
    cliJitter != null && cliJitter !== ""
      ? Number.parseInt(cliJitter, 10)
      : Number.isFinite(envJitter)
        ? Math.floor(envJitter)
        : 0;

  if (!Number.isFinite(minMs) || minMs < 0) {
    throw new Error(`Invalid --sleep-ms / EDAMAM_BATCH_MIN_SLEEP_MS`);
  }
  if (!Number.isFinite(jitterMs) || jitterMs < 0) {
    throw new Error(`Invalid --sleep-jitter-ms / EDAMAM_BATCH_SLEEP_JITTER_MS`);
  }
  return { minMs, jitterMs };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function paceBeforeEdamam(minMs: number, jitterMs: number): Promise<void> {
  const extra = jitterMs > 0 ? Math.floor(Math.random() * (jitterMs + 1)) : 0;
  const total = minMs + extra;
  if (total > 0) {
    console.log(`[ingest-batch] pacing ${total}ms before Edamam call`);
    await sleep(total);
  }
}

type RegionDishRow = {
  dish_id: string;
  dishes: { id: string; name_en: string; slug: string } | null;
};

type RegionRow = { id: string; slug: string; name: string };

type AttemptCounter = { value: number };

type RegionIngestTotals = {
  processed: number;
  skipped: number;
  failed: number;
  inserted: number;
  stoppedByLimit: boolean;
};

async function ingestOneRegion(
  supabase: SupabaseClient,
  region: RegionRow,
  options: {
    dryRun: boolean;
    maxAttempts: number | null;
    attempts: AttemptCounter;
    pacing: { minMs: number; jitterMs: number };
    adapter: EdamamAdapter | null;
  },
): Promise<RegionIngestTotals> {
  const { data: mappedRows, error: mapError } = await supabase
    .from("region_dish_mapping")
    .select("dish_id,dishes:dish_id(id,name_en,slug)")
    .eq("region_id", region.id);
  if (mapError) throw new Error(`Failed loading region dishes: ${mapError.message}`);

  const rows = (mappedRows ?? []) as unknown as RegionDishRow[];
  const dishes = rows
    .map((r) => r.dishes)
    .filter((d): d is NonNullable<RegionDishRow["dishes"]> => Boolean(d))
    .filter((d) => d.name_en.trim().length > 0);

  console.log(
    `[ingest-batch] region=${region.slug} (${region.name}) canonical_dishes=${dishes.length}`,
  );

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let inserted = 0;
  let stoppedByLimit = false;
  const { dryRun, maxAttempts, attempts, pacing, adapter } = options;

  for (const dish of dishes) {
    try {
      const { data: existing, error: existingError } = await supabase
        .schema("staging")
        .from("ingestion_raw")
        .select("id")
        .contains("raw_data", { dish_id: dish.id })
        .limit(1);
      if (existingError) {
        throw new Error(`failed staging lookup: ${existingError.message}`);
      }
      if ((existing ?? []).length > 0) {
        skipped += 1;
        console.log(`[skip] ${region.slug}/${dish.slug} (${dish.name_en}) already has staging row`);
        continue;
      }

      if (maxAttempts != null && attempts.value >= maxAttempts) {
        console.log(
          `[stop] --limit=${maxAttempts} reached globally (${skipped} skipped earlier in this region)`,
        );
        stoppedByLimit = true;
        break;
      }
      attempts.value += 1;
      processed += 1;

      if (dryRun) {
        console.log(`[dry-run] ${region.slug}/${dish.slug} would_ingest query="${dish.name_en}"`);
        continue;
      }

      console.log(`[run ] ${region.slug}/${dish.slug} query="${dish.name_en}"`);

      await paceBeforeEdamam(pacing.minMs, pacing.jitterMs);
      const fetchResult = await adapter!.searchFirstDish(dish.name_en);
      const transform = transformAndValidate(fetchResult.mapped);

      const status = !transform.success
        ? "rejected"
        : transform.confidence === "low"
          ? "needs_review"
          : "validated";
      const decision = !transform.success
        ? "rejected"
        : transform.confidence === "low"
          ? "flagged"
          : "accepted";
      const reason = !transform.success
        ? transform.error
        : transform.confidence === "low"
          ? `Low confidence: ${transform.lowConfidenceReasons.join(", ")}`
          : null;

      const { data: insertedRow, error: insertError } = await supabase
        .schema("staging")
        .from("ingestion_raw")
        .insert({
          source_name: "edamam_recipe_v2",
          raw_data: {
            region_slug: region.slug,
            region_name: region.name,
            dish_id: dish.id,
            dish_slug: dish.slug,
            dish_name_en: dish.name_en,
            requested_query: dish.name_en,
            source: fetchResult.source,
            edamam_response: fetchResult.raw,
            mapped: fetchResult.mapped,
            transform: {
              success: transform.success,
              confidence: transform.confidence,
              error: transform.success ? null : transform.error,
              low_confidence_reasons: transform.lowConfidenceReasons,
              dish: transform.success ? transform.data : null,
            },
          },
          status,
        })
        .select("id")
        .single();
      if (insertError) throw new Error(`insert ingestion_raw failed: ${insertError.message}`);

      const { error: auditError } = await supabase
        .schema("staging")
        .from("ingestion_audit")
        .insert({
          ingestion_raw_id: insertedRow.id,
          decision,
          reason,
        });
      if (auditError) throw new Error(`insert ingestion_audit failed: ${auditError.message}`);

      inserted += 1;
      console.log(`[ ok ] ${region.slug}/${dish.slug} -> ${status}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[fail] ${region.slug}/${dish.slug}: ${message}`);
      continue;
    }
  }

  console.log(
    `[summary] region=${region.slug} total_mapped=${dishes.length} processed=${processed} inserted=${inserted} skipped=${skipped} failed=${failed}` +
      (stoppedByLimit ? " (stopped: global limit)" : ""),
  );

  return { processed, skipped, failed, inserted, stoppedByLimit };
}

async function main() {
  const regionArg = (parseArg("--region") ?? "").trim().toLowerCase();
  if (!regionArg) {
    console.error(
      "Usage: npm run ingest:batch -- --region=<slug>|all [--dry-run] [--limit=<n>] [--sleep-ms=<n>] [--sleep-jitter-ms=<n>]",
    );
    console.error("  --region=all   every row in public.regions (ordered by slug)");
    console.error("  --limit        optional; max Edamam attempts after skips (global when using all)");
    process.exit(1);
  }

  const allRegions = regionArg === "all";
  const regionSlug = allRegions ? null : regionArg;

  const dryRun = hasFlag("--dry-run");
  const maxAttempts = parseLimit();
  const pacing = parsePacingMs();

  if (dryRun) {
    console.log("[ingest-batch] DRY RUN: no Edamam calls, no DB writes");
  }
  if (maxAttempts != null) {
    console.log(
      `[ingest-batch] limit=${maxAttempts} ingest attempts (after skips, global across regions when --region=all)`,
    );
  } else {
    console.log("[ingest-batch] no --limit: all eligible dishes will be attempted (per region)");
  }
  if (pacing.minMs > 0 || pacing.jitterMs > 0) {
    console.log(
      `[ingest-batch] extra pacing: min=${pacing.minMs}ms jitter=0..${pacing.jitterMs}ms (before each Edamam call)`,
    );
  }

  const supabase = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  let regions: RegionRow[];
  if (allRegions) {
    const { data, error } = await supabase
      .from("regions")
      .select("id,slug,name")
      .order("slug", { ascending: true });
    if (error) throw new Error(`Failed loading regions: ${error.message}`);
    regions = (data ?? []) as RegionRow[];
    if (regions.length === 0) {
      console.log("[ingest-batch] no regions in database");
      return;
    }
    console.log(`[ingest-batch] --region=all → ${regions.length} region(s)`);
  } else {
    const { data: region, error: regionError } = await supabase
      .from("regions")
      .select("id,slug,name")
      .eq("slug", regionSlug)
      .maybeSingle();
    if (regionError) throw new Error(`Failed loading region: ${regionError.message}`);
    if (!region) throw new Error(`Region not found for slug '${regionSlug}'`);
    regions = [region as RegionRow];
  }

  const adapter = dryRun ? null : new EdamamAdapter();
  const attempts: AttemptCounter = { value: 0 };

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalInserted = 0;

  for (const region of regions) {
    const stats = await ingestOneRegion(supabase, region, {
      dryRun,
      maxAttempts,
      attempts,
      pacing,
      adapter,
    });
    totalProcessed += stats.processed;
    totalSkipped += stats.skipped;
    totalFailed += stats.failed;
    totalInserted += stats.inserted;
    if (stats.stoppedByLimit) {
      break;
    }
  }

  console.log(
    `[ingest-batch] DONE dry_run=${dryRun} regions_run=${regions.length}` +
      ` total_attempts=${attempts.value} processed=${totalProcessed} inserted=${totalInserted} skipped=${totalSkipped} failed=${totalFailed}` +
      (maxAttempts != null ? ` limit=${maxAttempts}` : ""),
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[fatal] ${message}`);
  process.exit(1);
});
