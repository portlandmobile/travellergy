-- PostgREST / supabase-js access to `staging` after the schema is exposed in Data API.
-- Fixes: "permission denied for schema staging"
--
-- Run in Supabase → SQL Editor (once per project). Safe to re-run.

GRANT USAGE ON SCHEMA staging TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA staging TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA staging TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA staging
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA staging
  GRANT ALL ON SEQUENCES TO service_role;
