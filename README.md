# Der-Die-Das Master

German noun-gender learning game. See [der-die-das-master-blueprint.md](./der-die-das-master-blueprint.md) for the full architecture and roadmap.

## Monorepo layout

- `apps/web` — Next.js 16 app (game, SEO word pages, API routes, auth)
- `packages/word-data` — data pipeline that produces `processed/nouns.json`, the seed dataset
- `packages/shared` — TypeScript types shared between the pipeline and the app

## Getting started

```bash
pnpm install
pnpm --filter web db:generate   # generate a migration from lib/db/schema.ts (already done once, in drizzle/)
pnpm --filter web db:migrate    # apply migrations to local.db (a local SQLite file, zero cloud setup)
pnpm --filter web seed          # load packages/word-data/processed/nouns.json into local.db
pnpm dev                        # starts apps/web on http://localhost:3000
```

No environment variables are required to run locally — the DB falls back to a local SQLite
file and OAuth/magic-link sign-in are optional (buttons simply won't work until configured).

## Regenerating the word dataset

The full pipeline re-downloads the ~1GB Kaikki German Wiktionary dump, a frequency list, and
queries Tatoeba for example sentences — expect it to take a while on a cold cache.

```bash
pnpm --filter word-data run pipeline
pnpm --filter web seed   # reload the DB after regenerating nouns.json
```

Individual steps (`01-fetch-kaikki` … `07-validate`) can be re-run independently via
`pnpm --filter word-data run <step-name>`; each step caches its output, so re-running the
whole pipeline after a partial failure won't re-download or re-fetch what's already there.

## Connecting real cloud services

The app runs entirely locally by default. To point it at real infrastructure:

**Turso (database)**

```bash
turso auth login
turso db create der-die-das-master
turso db show der-die-das-master --url          # -> TURSO_DATABASE_URL
turso db tokens create der-die-das-master        # -> TURSO_AUTH_TOKEN
```

Add both to `apps/web/.env.local`, then re-run `pnpm --filter web db:migrate` and `pnpm --filter web seed` against the remote DB.

**Cloudflare Pages/Workers (hosting)**

```bash
cd apps/web
npx wrangler login
pnpm run cf:build      # builds + adapts the Next.js app for Cloudflare via @opennextjs/cloudflare
pnpm run cf:preview    # preview locally under Workers runtime
pnpm run cf:deploy     # deploy
```

Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, and any OAuth/Resend keys
as Cloudflare secrets (`npx wrangler secret put <NAME>`) before deploying.

## Status

- **Phase 0 (data pipeline)**: done — 3,156 validated A1–B1 nouns in `packages/word-data/processed/nouns.json`.
- **Phase 1 (core app skeleton)**: done — schema, local DB, auth wiring, and minimal
  `/`, `/word/[slug]`, `/play/[level]`, `/codex`, `/api/words` routes reading real seeded data.
- Game engine (scoring, streaks, "no word left behind" deck logic), SEO structured data, and
  gamification are Phase 2+ per the blueprint roadmap.
