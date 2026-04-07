import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const DEFAULT_CANONICAL_DIR = "../../vault/product/techlead/03-build/drafts";

type CanonicalIngredient = {
  item: string;
  confidence?: string;
  allergic_potential?: boolean;
};

type CanonicalAllergenCandidate = {
  allergen: string;
  probability?: number;
};

type CanonicalDish = {
  dish_id?: string;
  name: string;
  canonicalIngredients?: CanonicalIngredient[];
  allergenCandidates?: CanonicalAllergenCandidate[];
};

type CanonicalFile = {
  city: string;
  dishes: CanonicalDish[];
};

type CliArgs = {
  filePath: string | null;
  dirPath: string;
  countriesFile: string | null;
  skipExistingRegions: boolean;
  onlySlugs: Set<string> | null;
  dryRun: boolean;
  syncTypesense: boolean;
};

type Report = {
  files_scanned: number;
  files_loaded: number;
  files_skipped_existing_region: number;
  files_skipped_only_slugs: number;
  cities_seen: number;
  dishes_seen: number;
  regions_created: number;
  regions_existing: number;
  dishes_created: number;
  dishes_existing: number;
  region_dish_mappings_created: number;
  ingredients_created: number;
  ingredient_links_created: number;
  warnings: string[];
};

const ALLERGEN_NORMALIZATION: Record<string, string> = {
  wheat: "wheat",
  gluten: "wheat",
  soy: "soy",
  soybean: "soy",
  soybeans: "soy",
  fish: "fish",
  crustacean: "shellfish",
  crustaceans: "shellfish",
  shellfish: "shellfish",
  shrimp: "shellfish",
  prawn: "shellfish",
  crab: "shellfish",
  lobster: "shellfish",
  mollusk: "shellfish",
  mollusks: "shellfish",
  peanut: "peanut",
  peanuts: "peanut",
  nut: "tree nut",
  nuts: "tree nut",
  "tree nut": "tree nut",
  sesame: "sesame",
  dairy: "milk",
  milk: "milk",
  egg: "egg",
  eggs: "egg",
  legume: "legume",
};

function parseCliArgs(argv: string[]): CliArgs {
  let filePath: string | null = null;
  let dirPath = DEFAULT_CANONICAL_DIR;
  let countriesFile: string | null = null;
  let skipExistingRegions = false;
  let onlySlugs: Set<string> | null = null;
  let dryRun = false;
  let syncTypesense = true;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a === "--sync-typesense") {
      syncTypesense = true;
      continue;
    }
    if (a === "--no-sync-typesense") {
      syncTypesense = false;
      continue;
    }
    if (a.startsWith("--file=")) {
      filePath = a.slice("--file=".length).trim() || null;
      continue;
    }
    if (a.startsWith("--dir=")) {
      dirPath = a.slice("--dir=".length).trim() || dirPath;
      continue;
    }
    if (a === "--file" || a === "-f") {
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        filePath = next;
        i += 1;
      }
      continue;
    }
    if (a === "--dir" || a === "-d") {
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        dirPath = next;
        i += 1;
      }
      continue;
    }
    if (a.startsWith("--countries=")) {
      countriesFile = a.slice("--countries=".length).trim() || null;
      continue;
    }
    if (a === "--countries" || a === "-c") {
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        countriesFile = next;
        i += 1;
      }
      continue;
    }
    if (a === "--skip-existing-regions") {
      skipExistingRegions = true;
      continue;
    }
    if (a.startsWith("--only-slugs=")) {
      onlySlugs = parseSlugAllowlist(a.slice("--only-slugs=".length));
      continue;
    }
    if (a === "--only-slugs") {
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        onlySlugs = parseSlugAllowlist(next);
        i += 1;
      }
      continue;
    }
  }

  return {
    filePath,
    dirPath,
    countriesFile,
    skipExistingRegions,
    onlySlugs,
    dryRun,
    syncTypesense,
  };
}

function usage(): never {
  console.error(
    "Usage:\n" +
      "  npm run ingest:ecosystems -- --dir <drafts_dir> [--dry-run] [--sync-typesense]\n" +
      "  npm run ingest:ecosystems -- --file <CANONICAL_city.json> [--dry-run] [--sync-typesense]\n" +
      "  Optional: --countries <slug-to-code.json> merges over scripts/region-country-codes.json\n" +
      "  Optional: --skip-existing-regions  skip files whose region slug already exists (no new dishes for those cities)\n" +
      "  Optional: --only-slugs slug1,slug2  process only these region slugs (from CANONICAL_*.json basename)\n" +
      "Defaults:\n" +
      `  --dir ${DEFAULT_CANONICAL_DIR}`,
  );
  process.exit(1);
}

function parseSlugAllowlist(raw: string): Set<string> {
  const s = new Set<string>();
  for (const part of raw.split(",")) {
    const slug = toSlug(part.trim());
    if (slug) s.add(slug);
  }
  return s;
}

function loadCountryBySlug(overridePath: string | null): Record<string, string> {
  const defaultPath = path.join(SCRIPT_DIR, "region-country-codes.json");
  let base: Record<string, string> = {};
  if (fs.existsSync(defaultPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(defaultPath, "utf8")) as unknown;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        base = raw as Record<string, string>;
      }
    } catch {
      console.warn(`[warn] Could not parse ${defaultPath}; using empty base map.`);
    }
  }
  if (!overridePath) return base;
  const abs = path.resolve(process.cwd(), overridePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Countries file not found: ${abs}`);
  }
  const extra = JSON.parse(fs.readFileSync(abs, "utf8")) as Record<string, string>;
  return { ...base, ...extra };
}

function resolveCountryCode(
  regionSlug: string,
  countryBySlug: Record<string, string>,
): string {
  const raw = countryBySlug[regionSlug];
  if (!raw || typeof raw !== "string") return "ZZ";
  const c = raw.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  return c.length === 2 ? c : "ZZ";
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeAllergen(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (!key || key === "none") return null;
  return ALLERGEN_NORMALIZATION[key] ?? key;
}

function pseudoLatLng(seed: string): { lat: number; lng: number } {
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = (h1 * 31 + c) >>> 0;
    h2 = (h2 * 131 + c) >>> 0;
  }
  const lat = ((h1 % 1400000) / 10000) - 70;
  const lng = ((h2 % 3400000) / 10000) - 170;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

async function fetchAllRegionSlugs(): Promise<Set<string>> {
  const slugs = new Set<string>();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("regions")
      .select("slug")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data) {
      const s = row.slug as string | undefined;
      if (s) slugs.add(s);
    }
    if (data.length < pageSize) break;
  }
  return slugs;
}

function resolveCanonicalFiles(absFile: string | null, absDir: string): string[] {
  if (absFile) {
    if (!fs.existsSync(absFile)) {
      throw new Error(`File not found: ${absFile}`);
    }
    return [absFile];
  }

  if (!fs.existsSync(absDir)) {
    throw new Error(`Directory not found: ${absDir}`);
  }

  return fs
    .readdirSync(absDir)
    .filter((name) => /^CANONICAL_.*\.json$/i.test(name))
    .sort()
    .map((name) => path.join(absDir, name));
}

async function ensureRegion(
  regionSlug: string,
  dryRun: boolean,
  report: Report,
  countryCode: string,
): Promise<string | null> {
  const { data: found, error: findErr } = await supabase
    .from("regions")
    .select("id")
    .eq("slug", regionSlug)
    .maybeSingle();

  if (findErr) throw new Error(findErr.message);
  if (found?.id) {
    report.regions_existing += 1;
    return found.id as string;
  }

  const guessedName = titleCaseFromSlug(regionSlug);
  const { lat, lng } = pseudoLatLng(regionSlug);

  if (dryRun) {
    report.regions_created += 1;
    report.warnings.push(
      `[dry-run] create region slug=${regionSlug} name='${guessedName}' country_code='${countryCode}' lat=${lat} lng=${lng}`,
    );
    return `dry-region-${regionSlug}`;
  }

  const { data: created, error: createErr } = await supabase
    .from("regions")
    .insert({
      slug: regionSlug,
      name: guessedName,
      country_code: countryCode,
      is_active: true,
      latitude: lat,
      longitude: lng,
      geo: `SRID=4326;POINT(${lng} ${lat})`,
    })
    .select("id")
    .single();

  if (createErr || !created?.id) {
    throw new Error(
      `Failed creating region ${regionSlug}: ${createErr?.message ?? "unknown"}`,
    );
  }

  report.regions_created += 1;
  if (countryCode === "ZZ") {
    report.warnings.push(
      `Created region '${regionSlug}' with placeholder country_code='ZZ' (add slug to scripts/region-country-codes.json or pass --countries).`,
    );
  }
  return created.id as string;
}

async function ensureIngredient(
  nameRaw: string,
  dryRun: boolean,
  report: Report,
): Promise<string> {
  const name = nameRaw.trim().toLowerCase();
  if (!name) return "";

  const { data: existing, error: findErr } = await supabase
    .from("ingredients")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (existing?.id) return existing.id as string;

  if (dryRun) {
    report.ingredients_created += 1;
    return `dry-ingredient-${toSlug(name)}`;
  }

  const { data: created, error: createErr } = await supabase
    .from("ingredients")
    .insert({
      name,
      risk_level: "MEDIUM",
      description: "Imported from canonical city dataset",
    })
    .select("id")
    .single();

  if (createErr || !created?.id) {
    throw new Error(
      `Failed creating ingredient '${name}': ${createErr?.message ?? "unknown"}`,
    );
  }

  report.ingredients_created += 1;
  return created.id as string;
}

async function ensureDish(
  citySlug: string,
  dishName: string,
  dryRun: boolean,
  report: Report,
): Promise<string> {
  const slug = `${citySlug}-${toSlug(dishName)}`;

  const { data: existing, error: findErr } = await supabase
    .from("dishes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (existing?.id) {
    report.dishes_existing += 1;
    return existing.id as string;
  }

  if (dryRun) {
    report.dishes_created += 1;
    return `dry-dish-${slug}`;
  }

  const { data: created, error: createErr } = await supabase
    .from("dishes")
    .insert({
      slug,
      name_en: dishName,
      name_local: dishName,
      description: `Imported canonical dish for ${titleCaseFromSlug(citySlug)}.`,
      is_common_allergen_risk: true,
    })
    .select("id")
    .single();

  if (createErr || !created?.id) {
    throw new Error(
      `Failed creating dish '${slug}': ${createErr?.message ?? "unknown"}`,
    );
  }

  report.dishes_created += 1;
  return created.id as string;
}

async function ensureRegionDishMapping(
  regionId: string,
  dishId: string,
  dryRun: boolean,
  report: Report,
): Promise<void> {
  if (dryRun) {
    report.region_dish_mappings_created += 1;
    return;
  }

  const { data: existing, error: findErr } = await supabase
    .from("region_dish_mapping")
    .select("dish_id")
    .eq("region_id", regionId)
    .eq("dish_id", dishId)
    .maybeSingle();

  if (findErr) throw new Error(findErr.message);
  if (existing) return;

  const { error } = await supabase.from("region_dish_mapping").insert({
    region_id: regionId,
    dish_id: dishId,
    prevalence: "COMMON",
    notes: "Imported from canonical city dataset",
  });
  if (error) throw new Error(error.message);

  report.region_dish_mappings_created += 1;
}

async function ensureDishIngredientLink(
  dishId: string,
  ingredientId: string,
  isHidden: boolean,
  dryRun: boolean,
  report: Report,
): Promise<void> {
  if (!ingredientId) return;
  if (dryRun) {
    report.ingredient_links_created += 1;
    return;
  }

  const { data: existing, error: findErr } = await supabase
    .from("dish_ingredients")
    .select("dish_id")
    .eq("dish_id", dishId)
    .eq("ingredient_id", ingredientId)
    .maybeSingle();

  if (findErr) throw new Error(findErr.message);
  if (existing) return;

  const { error } = await supabase.from("dish_ingredients").insert({
    dish_id: dishId,
    ingredient_id: ingredientId,
    is_hidden_ingredient: isHidden,
  });
  if (error) throw new Error(error.message);

  report.ingredient_links_created += 1;
}

function extractRegionSlugFromFile(filePath: string, cityName: string): string {
  const base = path.basename(filePath, ".json");
  const fromName = base.replace(/^CANONICAL_/i, "").trim();
  if (fromName) return toSlug(fromName.replace(/_/g, " "));
  return toSlug(cityName);
}

function buildIngredientNames(
  dish: CanonicalDish,
): { name: string; isHidden: boolean }[] {
  const out: { name: string; isHidden: boolean }[] = [];

  for (const ing of dish.canonicalIngredients ?? []) {
    const n = ing.item?.trim();
    if (!n) continue;
    out.push({ name: n, isHidden: Boolean(ing.allergic_potential) });
  }

  for (const c of dish.allergenCandidates ?? []) {
    const normalized = normalizeAllergen(c.allergen);
    if (!normalized) continue;
    out.push({ name: normalized, isHidden: true });
  }

  const dedup = new Map<string, { name: string; isHidden: boolean }>();
  for (const item of out) {
    const key = item.name.trim().toLowerCase();
    const prev = dedup.get(key);
    if (!prev) {
      dedup.set(key, item);
    } else if (!prev.isHidden && item.isHidden) {
      dedup.set(key, item);
    }
  }

  return [...dedup.values()];
}

async function processCanonicalFile(
  filePath: string,
  dryRun: boolean,
  report: Report,
  countryBySlug: Record<string, string>,
): Promise<void> {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as CanonicalFile;

  if (!parsed.city || !Array.isArray(parsed.dishes)) {
    report.warnings.push(`Skipping invalid canonical file: ${filePath}`);
    return;
  }

  const regionSlug = extractRegionSlugFromFile(filePath, parsed.city);
  const countryCode = resolveCountryCode(regionSlug, countryBySlug);
  const regionId = await ensureRegion(regionSlug, dryRun, report, countryCode);
  if (!regionId) return;

  report.files_loaded += 1;
  report.cities_seen += 1;

  for (const dish of parsed.dishes) {
    if (!dish.name?.trim()) {
      report.warnings.push(`Skipping unnamed dish in ${filePath}`);
      continue;
    }

    report.dishes_seen += 1;
    const dishId = await ensureDish(regionSlug, dish.name.trim(), dryRun, report);
    await ensureRegionDishMapping(regionId, dishId, dryRun, report);

    const ingredientNames = buildIngredientNames(dish);
    for (const ing of ingredientNames) {
      const ingredientId = await ensureIngredient(ing.name, dryRun, report);
      await ensureDishIngredientLink(
        dishId,
        ingredientId,
        ing.isHidden,
        dryRun,
        report,
      );
    }
  }
}

function maybeSyncTypesense(syncTypesense: boolean): void {
  if (!syncTypesense) return;
  const r = spawnSync("npm", ["run", "sync:typesense:regions"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.warn(
      "[warn] Typesense sync failed. Run manually: npm run sync:typesense:regions",
    );
  }
}

async function ingest() {
  const args = parseCliArgs(process.argv);
  const absFile = args.filePath
    ? path.resolve(process.cwd(), args.filePath)
    : null;
  const absDir = path.resolve(process.cwd(), args.dirPath);

  let files: string[];
  try {
    files = resolveCanonicalFiles(absFile, absDir);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    usage();
  }

  if (files.length === 0) {
    console.error("No CANONICAL_*.json files found.");
    process.exit(1);
  }

  let countryBySlug: Record<string, string>;
  try {
    countryBySlug = loadCountryBySlug(args.countriesFile);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  let existingRegionSlugs: Set<string> | null = null;
  if (args.skipExistingRegions) {
    try {
      existingRegionSlugs = await fetchAllRegionSlugs();
      console.log(
        `[ingest-canonical] skip-existing-regions: ${existingRegionSlugs.size} slug(s) already in DB`,
      );
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  }

  const report: Report = {
    files_scanned: files.length,
    files_loaded: 0,
    files_skipped_existing_region: 0,
    files_skipped_only_slugs: 0,
    cities_seen: 0,
    dishes_seen: 0,
    regions_created: 0,
    regions_existing: 0,
    dishes_created: 0,
    dishes_existing: 0,
    region_dish_mappings_created: 0,
    ingredients_created: 0,
    ingredient_links_created: 0,
    warnings: [],
  };

  console.log(
    `[ingest-canonical] mode=${args.dryRun ? "dry-run" : "write"} files=${files.length} source=${absFile ?? absDir}`,
  );

  for (const file of files) {
    const regionSlug = extractRegionSlugFromFile(file, "");
    if (args.onlySlugs && !args.onlySlugs.has(regionSlug)) {
      report.files_skipped_only_slugs += 1;
      console.log(
        `[skip] ${path.basename(file)} (not in --only-slugs; slug=${regionSlug || "?"})`,
      );
      continue;
    }
    if (args.skipExistingRegions && existingRegionSlugs?.has(regionSlug)) {
      report.files_skipped_existing_region += 1;
      console.log(
        `[skip] ${path.basename(file)} (region already exists: ${regionSlug})`,
      );
      continue;
    }
    console.log(`[file] ${path.basename(file)}`);
    try {
      await processCanonicalFile(file, args.dryRun, report, countryBySlug);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      report.warnings.push(`Error in ${file}: ${msg}`);
      console.error(`[error] ${path.basename(file)}: ${msg}`);
    }
  }

  console.log("[ingest-canonical] report:");
  console.log(JSON.stringify(report, null, 2));

  if (!args.dryRun) {
    maybeSyncTypesense(args.syncTypesense);
  }
}

ingest().catch((error) => {
  console.error(error);
  process.exit(1);
});
