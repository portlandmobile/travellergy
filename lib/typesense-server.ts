import Typesense from "typesense";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getTypesenseClient() {
  const host = required("TYPESENSE_HOST");
  const port = Number(process.env.TYPESENSE_PORT ?? "443");
  const protocol = process.env.TYPESENSE_PROTOCOL ?? "https";
  const apiKey = required("TYPESENSE_API_KEY");

  return new Typesense.Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    connectionTimeoutSeconds: 5,
  });
}

export function getRegionsCollectionName(): string {
  return process.env.TYPESENSE_COLLECTION ?? "regions";
}
