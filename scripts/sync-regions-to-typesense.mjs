import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import Typesense from "typesense";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

function required(name) {
  const raw = process.env[name];
  const value = normalizeEnvValue(raw);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeEnvValue(value) {
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

function createTypesenseClient() {
  const host = required("TYPESENSE_HOST");
  const port = Number(process.env.TYPESENSE_PORT ?? "443");
  const protocol = process.env.TYPESENSE_PROTOCOL ?? "https";
  const apiKey =
    normalizeEnvValue(process.env.TYPESENSE_ADMIN_API_KEY) ||
    required("TYPESENSE_API_KEY");

  return new Typesense.Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    connectionTimeoutSeconds: 5,
  });
}

async function ensureRegionsCollection(client, collectionName) {
  try {
    await client.collections(collectionName).retrieve();
  } catch {
    await client.collections().create({
      name: collectionName,
      fields: [
        { name: "slug", type: "string" },
        { name: "name", type: "string" },
        { name: "country_code", type: "string", facet: true },
      ],
    });
  }
}

async function main() {
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const collectionName = process.env.TYPESENSE_COLLECTION ?? "regions";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const typesense = createTypesenseClient();

  const { data, error } = await supabase
    .from("regions")
    .select("slug,name,country_code")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  const regions = data ?? [];
  await ensureRegionsCollection(typesense, collectionName);

  for (const region of regions) {
    await typesense
      .collections(collectionName)
      .documents()
      .upsert({
        slug: region.slug,
        name: region.name,
        country_code: region.country_code,
      });
  }

  console.log(
    `Synced ${regions.length} regions to Typesense collection '${collectionName}'.`,
  );
}

main().catch((error) => {
  if (error?.httpStatus === 401) {
    console.error(
      "Typesense authorization failed. Verify TYPESENSE_HOST and use an Admin API key in TYPESENSE_ADMIN_API_KEY or TYPESENSE_API_KEY.",
    );
  }
  console.error(error);
  process.exit(1);
});
