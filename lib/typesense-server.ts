import Typesense from "typesense";

function required(name: string): string {
  const value = normalizeEnvValue(process.env[name]);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

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

export function getTypesenseClient() {
  const host = required("TYPESENSE_HOST");
  const port = Number(process.env.TYPESENSE_PORT ?? "443");
  const protocol = normalizeEnvValue(process.env.TYPESENSE_PROTOCOL) || "https";
  const apiKey =
    normalizeEnvValue(process.env.TYPESENSE_ADMIN_API_KEY) ||
    required("TYPESENSE_API_KEY");

  return new Typesense.Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    connectionTimeoutSeconds: 5,
  });
}

export function getRegionsCollectionName(): string {
  return process.env.TYPESENSE_COLLECTION ?? "regions";
}

export function getEcosystemsCollectionName(): string {
  return process.env.TYPESENSE_ECOSYSTEMS_COLLECTION ?? "culinary_ecosystems";
}
