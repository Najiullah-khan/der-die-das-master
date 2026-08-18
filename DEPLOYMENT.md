# Deployment Guide

Der-Die-Das Master is built around **Cloudflare Pages/Workers** — that's not an arbitrary choice,
it's baked into the code: `@opennextjs/cloudflare` builds the app, `wrangler.jsonc` defines the
Worker, and several architectural decisions only make sense on Cloudflare's stateless-per-request
edge model (see the callouts in Step 2 and the Notes at the end). That's the path documented here.
A Vercel deployment is *possible* but would mean revisiting those decisions — see [Alternative:
Vercel](#alternative-vercel) at the end if you want that instead.

---

## 1. Database Setup (Turso)

The app runs on libSQL/SQLite via [Turso](https://turso.tech). Locally it falls back to a SQLite
file (`./local.db`) with zero setup — production needs a real Turso database.

```bash
# One-time: install the CLI and log in
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login

# Create the database (region close to your users; sqlite-compatible everywhere)
turso db create der-die-das-master

# Get the connection URL and an auth token — you'll need both as env vars (Step 3)
turso db show der-die-das-master --url
turso db tokens create der-die-das-master
```

Run migrations against it (from `apps/web`, with `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` set in
your shell or `.env.local`):

```bash
cd apps/web
pnpm db:migrate
```

This applies every file in `/drizzle` in order — the same migrations already verified against
local SQLite during development, not a separate `db:push`/introspection step, so there's nothing
schema-drift-prone about it.

Seed the word dictionary (the core dataset the whole app is built around):

```bash
pnpm seed
```

This reads `packages/word-data/processed/nouns.json` and upserts every word — safe to re-run
(`onConflictDoNothing`).

**Optional:** `pnpm refresh-leaderboard` populates the materialized `leaderboard` table once so
`/leaderboard?range=alltime` isn't empty on first load — see the Cron Trigger note in Step 4,
which keeps it fresh automatically after that.

---

## 2. Hosting: Cloudflare Pages/Workers

### One-time setup

```bash
npm install -g wrangler
wrangler login
```

### Build & deploy

From `apps/web`:

```bash
pnpm cf:build     # opennextjs-cloudflare build — produces .open-next/
pnpm cf:deploy     # builds again, then wrangler deploy
```

The first `wrangler deploy` will prompt you to confirm the Worker name (`der-die-das-master`, set
in `wrangler.jsonc`) and create it if it doesn't exist yet.

### Environment variables & secrets

Set every variable from the [checklist](#3-environment-variables-checklist) below via the
Cloudflare dashboard (**Workers & Pages → der-die-das-master → Settings → Variables**) or the CLI:

```bash
# Secrets (encrypted, never shown again in the dashboard)
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put CRON_SECRET
wrangler secret put SENTRY_DSN

# Plain vars (non-secret) — set via the dashboard's "Variables" tab, or:
wrangler deploy --var TURSO_DATABASE_URL:"libsql://..." --var BETTER_AUTH_URL:"https://yourdomain.com" ...
```

Plain vars are easiest to manage from the dashboard directly rather than repeating `--var` flags
on every deploy; secrets should always go through `wrangler secret put` (or the dashboard's
"Encrypt" toggle), never committed or passed as plain `--var`.

### Cloudflare Cron Trigger (leaderboard refresh)

The all-time leaderboard is a materialized table (`leaderboard`), refreshed by
`POST /api/cron/refresh-leaderboard` — a secret-protected route, not something exposed publicly.
Wire a real Cron Trigger to it:

**Dashboard:** Workers & Pages → der-die-das-master → Settings → Triggers → Cron Triggers → Add
(e.g. `*/30 * * * *` for every 30 minutes), or in `wrangler.jsonc`:

```jsonc
"triggers": { "crons": ["*/30 * * * *"] }
```

Cloudflare Cron Triggers invoke your Worker's `scheduled()` handler, not an arbitrary HTTP route
directly — the simplest bridge for a Next.js-on-Workers app is an external scheduler (e.g. a free
[cron-job.org](https://cron-job.org) task, or GitHub Actions on a schedule) hitting:

```
POST https://yourdomain.com/api/cron/refresh-leaderboard
Authorization: Bearer <CRON_SECRET>
```

### Domain

Workers & Pages → der-die-das-master → Settings → Domains & Routes → Add a custom domain. SSL is
automatic (Cloudflare-managed certificate) — no separate cert step.

---

## 3. Environment Variables Checklist

All names below are the actual variable names this codebase reads (see `apps/web/.env.example`
for the authoritative, current copy — check it if this list and that file ever disagree).

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Your production origin, e.g. `https://yourdomain.com`. The **only** public var — used for canonical URLs, sitemap, OG images. |
| `TURSO_DATABASE_URL` | Yes | From `turso db show ... --url`. |
| `TURSO_AUTH_TOKEN` | Yes (secret) | From `turso db tokens create ...`. |
| `BETTER_AUTH_SECRET` | Yes (secret) | `openssl rand -base64 32`. Signs session cookies — losing/rotating this invalidates all sessions. |
| `BETTER_AUTH_URL` | Yes | Same as `NEXT_PUBLIC_SITE_URL`, without trailing slash. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Google sign-in silently unavailable if unset — not a hard failure. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional | Same, for GitHub sign-in. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Optional | Magic-link email. Unset → the link is logged server-side instead of emailed (fine for staging, not for real users). |
| `ADMIN_EMAIL` | Yes, if you use `/admin` | The **one** account email allowed into the blog CRUD/feedback inbox. Everyone else gets 403. |
| `CRON_SECRET` | Yes, if you wire the leaderboard cron | Bearer token `POST /api/cron/refresh-leaderboard` checks for. |
| `SENTRY_DSN` | Optional | `https://<publicKey>@<host>/<projectId>` from a Sentry project's Client Keys. Unset → errors just log to the console (see `instrumentation.ts`). |

**Security note (verified during this audit):** every secret above is deliberately *not*
`NEXT_PUBLIC_`-prefixed — only `NEXT_PUBLIC_SITE_URL` is, and it's not sensitive (it's the site's
own public URL). Don't add a `NEXT_PUBLIC_` prefix to any of the others; that would ship them to
every visitor's browser bundle.

---

## 4. Post-Deployment Checklist

- [ ] **Migrations applied**: `pnpm db:migrate` ran against the *production* Turso DB (not just
      local) — confirm with `turso db shell der-die-das-master ".tables"`.
- [ ] **Words seeded**: `pnpm seed` ran against production; spot-check `/codex` isn't empty.
- [ ] **Domain resolves over HTTPS**, and `http://` redirects to `https://` (Cloudflare does this
      automatically once the domain is added — just confirm it).
- [ ] **OAuth redirect URLs updated** in each provider's console, or sign-in will fail with a
      redirect_uri_mismatch:
  - Google Cloud Console → Credentials → your OAuth client → Authorized redirect URIs → add
    `https://yourdomain.com/api/auth/callback/google`
  - GitHub → Settings → Developer settings → OAuth Apps → your app → Authorization callback URL →
    `https://yourdomain.com/api/auth/callback/github`
- [ ] **`NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL`** both point at the real production domain,
      not `localhost` — a leftover localhost value here breaks OAuth callbacks, the sitemap, and
      every canonical/OG URL.
- [ ] **Sitemap live**: `https://yourdomain.com/sitemap.xml` returns entries; submit it to
      [Google Search Console](https://search.google.com/search-console) and
      [Bing Webmaster Tools](https://www.bing.com/webmasters) (both free, both external accounts
      only you can create — not something this doc or any script can do for you).
- [ ] **Rich results check**: paste a `/word/[slug]` URL into Google's
      [Rich Results Test](https://search.google.com/test/rich-results) — confirms the FAQPage/
      DefinedTerm/BreadcrumbList JSON-LD parses correctly.
- [ ] **Security headers present**: `curl -I https://yourdomain.com` and confirm
      `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options` are all there
      (set in `next.config.ts` — should carry through automatically, but worth a real check post-deploy).
- [ ] **Leaderboard cron actually firing**: check `leaderboard.rankAlltime` isn't stale after the
      interval you configured (`turso db shell ... "select * from leaderboard limit 5"`).
- [ ] **Web Vitals / Lighthouse**: run Lighthouse (Chrome DevTools → Lighthouse, or
      [PageSpeed Insights](https://pagespeed.web.dev)) against the live homepage and a `/word/[slug]`
      page. This app has no images and minimal client JS by design, so there's no structural
      reason for Core Web Vitals to be anything but strong — a bad score post-deploy usually
      means a hosting/CDN-caching misconfiguration, not the app itself.
- [ ] **Error monitoring**: if `SENTRY_DSN` is set, trigger a harmless test error and confirm it
      shows up in the Sentry project.

---

## Notes on why this is Cloudflare, not "any Node host"

A few things in this codebase are specifically engineered around Cloudflare Workers' **stateless,
per-request-isolate** execution model — they'd need to change on a host that doesn't share that
constraint:

- **Rate limiting is DB-backed, not in-memory** (`lib/security/rate-limit.ts`, and Better Auth's
  own limiter set to `storage: "database"` in `lib/auth/config.ts`). An in-memory counter resets
  on every cold isolate on Workers, so it silently stops limiting anything.
- **The Cron Trigger bridges to an HTTP route** rather than running a persistent scheduled process,
  because Workers don't have long-running background processes.

None of this is a *hard* blocker to deploying on Vercel or another Node host instead — but on a
host with a persistent server process, an in-memory rate limiter would actually be simpler and
faster than the DB round-trip this app currently takes, so if you do move off Cloudflare, revisit
`lib/security/rate-limit.ts` rather than assuming the current implementation is still the right
one for that environment.

## Alternative: Vercel

Not the configured path (no `vercel.json`, and the build pipeline is opennextjs-cloudflare, not
`next build`'s native Vercel output), but broadly possible:

1. Remove/ignore `wrangler.jsonc` and `@opennextjs/cloudflare` — Vercel's own Next.js build
   handles the adapter automatically, no config needed.
2. Turso still works identically (it's just an HTTP/libSQL endpoint, not Cloudflare-specific) —
   Steps 1 and 3 above are unchanged.
3. Set the same environment variables in the Vercel dashboard (Project → Settings →
   Environment Variables) instead of via `wrangler secret put`.
4. The leaderboard refresh can become a native
   [Vercel Cron Job](https://vercel.com/docs/cron-jobs) (`vercel.json`) instead of the external-scheduler
   workaround above, since Vercel Cron can hit your own deployment's routes directly.
5. Reconsider the in-memory-vs-DB-backed rate-limiting tradeoff noted above — Vercel's serverless
   functions are also stateless per-invocation (though less aggressively so than Workers), so the
   DB-backed approach is still *correct* there, just possibly not the fastest option available.
