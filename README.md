# Travellergy

Slice 1 scaffold for Travellergy using Next.js App Router with CI/CD and deployment setup.

## Stack

- Next.js 15+ (App Router)
- Supabase (PostgreSQL + PostGIS)
- Typesense
- Clerk
- Vercel

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Copy environment template:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The skeleton page should display `Travellergy`.

## Environment Variables

The `.env.example` file includes all currently required keys for this slice:

- Supabase
- Clerk
- Typesense

Supabase project URL is prefilled for:
`https://supabase.com/dashboard/project/rwtodytvjwbgadqwkvno`

### Typesense Cloud setup

For this project, use Typesense Cloud (not self-hosted).

- `TYPESENSE_HOST`: cloud node hostname only (no protocol, no port)
- `TYPESENSE_PORT`: `443`
- `TYPESENSE_PROTOCOL`: `https`
- `TYPESENSE_API_KEY`: admin key for server-side sync/indexing

After setting env vars, sync regions:

```bash
npm run sync:typesense:regions
```

## CI/CD

GitHub Actions workflow is defined in `.github/workflows/ci.yml`.

It runs on pushes to `main` and pull requests:

- `npm ci`
- `npm run lint`
- `npm run build`

## Ingestion API (Slice 12)

Protected by `Authorization: Bearer <INGESTION_API_SECRET>`.

- `POST /api/ingest/edamam`
  - Body: `{ "query": "pad thai" }`
  - Runs adapter + transformer, persists to `staging.ingestion_raw`, writes `staging.ingestion_audit`.
- `GET /api/ingest/review?status=needs_review&limit=20`
  - Lists staging rows for review queues (`pending|needs_review|validated|rejected`).
- `POST /api/ingest/review/:id`
  - Body: `{ "decision": "accepted|rejected|flagged", "reason": "optional note" }`
  - Updates row status and appends an audit decision.

## Dish-First Batch Ingestion (Slice 13)

- Command: `npm run ingest:batch -- --region=<region-slug> [--dry-run] [--limit=<n>]`
- Flags:
  - `--dry-run` — only reads Supabase; lists dishes that would be ingested (no Edamam, no writes).
  - `--limit=<n>` — cap how many dishes to **attempt** after skips (each attempt uses one Edamam call when not dry-run).
  - `--sleep-ms=<n>` / `--sleep-jitter-ms=<n>` — optional extra wait before **each** Edamam call (e.g. `30000` + `10000` ≈ 30–40s). Env: `EDAMAM_BATCH_MIN_SLEEP_MS`, `EDAMAM_BATCH_SLEEP_JITTER_MS`.
- Edamam `429` responses are retried with `Retry-After` (when present) or exponential backoff + jitter; configure `EDAMAM_429_MAX_ATTEMPTS` (default 6).
- Flow:
  - Loads canonical dishes from `region_dish_mapping` + `dishes`
  - Skips dishes that already have any `staging.ingestion_raw` row for that `dish_id`
  - Queries Edamam by canonical `dishes.name_en`
  - Persists to `staging.ingestion_raw` + `staging.ingestion_audit`
  - Continues on per-dish errors and prints a summary at the end

## Vercel Deployment

This repository is expected to be connected to an existing Vercel project.

In Vercel project settings:

1. Add environment variables from `.env.example`.
2. Ensure Production branch is `main`.
3. Trigger a deployment from `main` push.
