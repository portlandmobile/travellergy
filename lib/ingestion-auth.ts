import { timingSafeEqual } from "node:crypto";

/**
 * Bearer token must match INGESTION_API_SECRET (server-only).
 */
export function verifyIngestionBearer(request: Request): boolean {
  const secret = process.env.INGESTION_API_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  const token =
    auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  if (!token) return false;

  try {
    const a = Buffer.from(secret, "utf8");
    const b = Buffer.from(token, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function ingestionSecretConfigured(): boolean {
  return Boolean(process.env.INGESTION_API_SECRET?.trim());
}
