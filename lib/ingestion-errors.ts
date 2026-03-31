/** Map common Supabase/PostgREST staging errors to actionable fix hints. */
export function clarifySupabaseStagingError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid schema") && lower.includes("staging")) {
    return `${message}. Fix: Supabase Dashboard -> Project Settings -> Data API -> Exposed schemas: add "staging" alongside "public", then run database/slice12_staging_api_grants.sql.`;
  }
  if (
    lower.includes("permission denied") &&
    lower.includes("schema") &&
    lower.includes("staging")
  ) {
    return `${message}. Fix: run database/slice12_staging_api_grants.sql in the SQL Editor (grants USAGE on schema + ALL on tables/sequences to service_role).`;
  }
  return message;
}
