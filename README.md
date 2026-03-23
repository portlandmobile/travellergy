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

## CI/CD

GitHub Actions workflow is defined in `.github/workflows/ci.yml`.

It runs on pushes to `main` and pull requests:

- `npm ci`
- `npm run lint`
- `npm run build`

## Vercel Deployment

This repository is expected to be connected to an existing Vercel project.

In Vercel project settings:

1. Add environment variables from `.env.example`.
2. Ensure Production branch is `main`.
3. Trigger a deployment from `main` push.
