# DEPLOY — Tripwire on Railway + PlanetScale

Production deployment runbook. Owner decisions: **three services on Railway**
(web + api + worker), **Postgres on PlanetScale**, Railway **Hobby** plan.

> Why this exists: `APP_URL` was `localhost`, so every blocked contributor got a
> dead "View on Tripwire" link and a broken badge image (this hit a real
> contributor on dither-kit#8). The run page, the badge, and the public evidence
> view are all built and all invisible until this deploy lands.

Local dev is unchanged by everything here: `dev:demo`, the persona switcher, the
cloudflared tunnel, and `test:run` all keep working. `docker-compose.yml` is
local-only (Postgres for dev/tests).

Credential-gated steps (creating the DB, deploying, repointing the webhook,
running the smoke test) are the **owner's** to run — secrets never enter an
agent session. Each is written below as copy-paste commands.

---

## 1. The three services

All three build from **one repo, one build context (the monorepo root)**. Each
Railway service points at its own Dockerfile and its own config-as-code file.

| Service      | Dockerfile              | Config file              | Runtime       | Listens | Healthcheck |
| ------------ | ----------------------- | ------------------------ | ------------- | ------- | ----------- |
| **web**      | `apps/web/Dockerfile`   | `apps/web/railway.json`  | node:22 (SSR) | `PORT`  | `/login`    |
| **api**      | `apps/api/Dockerfile`   | `apps/api/railway.json`  | bun:1.3       | `PORT`  | `/healthz`  |
| **worker**   | `apps/worker/Dockerfile`| `apps/worker/railway.json`| bun:1.3      | `PORT`  | `/healthz`  |

### Per-service Railway settings (dashboard, once per service)

- **Root Directory: repo root (leave empty).** ← critical. The Dockerfiles
  `COPY packages ./packages` etc. from the monorepo root; if you set Root
  Directory to `apps/api` the build context shrinks and the build fails.
- **Config-as-code path:** set each service's config file to the table's
  "Config file" (e.g. `apps/api/railway.json`). That file pins the builder
  (`DOCKERFILE`), the `dockerfilePath`, the healthcheck, and the watch patterns.
- **Build command / Start command:** none. The Dockerfile `CMD` is the start
  command; there is no separate build step (api/worker run TS directly on Bun;
  web's `vite build` runs inside its Dockerfile).
- **Networking:** give **web** and **api** each a public domain (Settings →
  Networking → Generate Domain, or a custom domain). **worker gets NO public
  domain** — its `/healthz` is internal-only; Railway's healthcheck reaches it
  without one.

### Watch paths (so a web-only change doesn't rebuild the worker)

Each `railway.json` sets `build.watchPatterns`. A change only under `apps/web/**`
matches **web** but not **worker** or **api**, so only web rebuilds. A change
under `packages/**` (shared code) rebuilds **all three** — correct, because the
worker links `@tripwire/core`, the api links `@tripwire/db`, etc.

- web: `apps/web/**`, `packages/**`, `package.json`, `bun.lock`, `bunfig.toml`, `tsconfig.base.json`
- api: `apps/api/**`, `packages/**`, `package.json`, `bun.lock`, `bunfig.toml`
- worker: `apps/worker/**`, `packages/**`, `package.json`, `bun.lock`, `bunfig.toml`

### The one build-time env you cannot get wrong

`VITE_SITE_URL` is read via `import.meta.env` (seo.ts) and **inlined at build
time**. Set it as a **build variable / build arg** on the **web** service to the
real public web URL *before the first build*, or every canonical/OG tag bakes to
`localhost`. It is passed to `docker build` as `--build-arg VITE_SITE_URL=…`; on
Railway, a service variable named `VITE_SITE_URL` is available to the Docker
build. Everything else the web server reads is runtime `process.env`.

---

## 2. Env matrix

`S` = secret (Railway "sealed" / never in git). `NODE_ENV=production` on all
three. Blank cells = the service does not read the var.

| Variable                     | web | api | worker | Secret | Notes                                                                 |
| ---------------------------- | --- | --- | ------ | ------ | --------------------------------------------------------------------- |
| `NODE_ENV=production`        | ✅  | ✅  | ✅     |        | Baked into the images; set anyway for clarity.                        |
| `DATABASE_URL`               | ✅  | ✅  | ✅     | S      | PlanetScale **pooled** URL — transactional + query work.              |
| `DATABASE_URL_DIRECT`        |     | ✅  | ✅     | S      | PlanetScale **direct/session** URL — LISTEN/NOTIFY only (Unit 3).     |
| `APP_URL`                    |     |     | ✅     |        | **THE FIX.** Real public **web** URL → run deep links + badge in PR comments. |
| `VITE_SITE_URL`              | 🔨  |     |        |        | **Build-time** (build arg). Real public web URL → SEO/OG canonical.   |
| `VITE_API_URL`              | ✅  |     |        |        | Runtime. The public **api** URL (web SSR proxies SSE to it).          |
| `WEB_ORIGIN`                 |     | ✅  |        |        | The public **web** URL — CORS origin the api allows for SSE.          |
| `BETTER_AUTH_SECRET`         | ✅  | ✅  |        | S      | `openssl rand -hex 32`. Missing in prod ⇒ **refuses to boot**.        |
| `BETTER_AUTH_URL`            | ✅  | ✅  |        |        | Real public **web** URL (OAuth callback origin).                      |
| `GITHUB_OAUTH_CLIENT_ID`     | ✅  |     |        |        | Dashboard sign-in (GitHub OAuth app).                                 |
| `GITHUB_OAUTH_CLIENT_SECRET` | ✅  |     |        | S      |                                                                       |
| `GITHUB_APP_ID`              |     | ✅  | ✅     |        | The GitHub App (ingest + actions).                                    |
| `GITHUB_APP_PRIVATE_KEY`     |     | ✅  | ✅     | S      | PEM with escaped `\n` (worker un-escapes). Quote it.                  |
| `GITHUB_WEBHOOK_SECRET`      |     | ✅  | ✅     | S      | `openssl rand -hex 32`; same value in the App's webhook settings. api verifies; worker parses. |
| `GITHUB_APP_SLUG`            | ✅  |     |        |        | `github.com/apps/<slug>` — builds the install URL on /onboarding.     |
| `OPENROUTER_API_KEY`         |     |     | ✅     | S      | ai-review. Unset ⇒ ai-review skips (counts toward degradation floor). |
| `AI_REVIEW_MODEL`            |     |     | ✅     |        | Default OpenRouter slug; explicit rule config wins.                   |
| `PORT`                       | ✅  | ✅  | ✅     |        | **Injected by Railway.** Do not set it yourself.                      |

Notes:
- `APP_URL` (worker) and `BETTER_AUTH_URL`/`VITE_SITE_URL`/`WEB_ORIGIN` (web/api)
  all mean "the real public **web** URL". `VITE_API_URL` means the public **api**
  URL. Get these from Railway's generated (or custom) domains after first deploy,
  then set and redeploy.
- `GITHUB_APP_ID` / `GITHUB_APP_PRIVATE_KEY` / `GITHUB_WEBHOOK_SECRET` go on
  **both** api (verify) and worker (parse + act). Same values on both.
- `.env.example` documents every var; Railway holds the values. **Never commit
  secrets.**

### Production posture check — assert these FIRE before trusting the deploy

Two fail-closed guards already exist. The deploy is not safe until both are
confirmed on the live services:

1. **Missing `BETTER_AUTH_SECRET` refuses to boot.** `resolveAuthPosture`
   throws under `NODE_ENV=production` with no secret; api/web exit 1.
   *Verified locally in Unit 1:* the api container exits 1 with
   `"auth posture check failed — refusing to boot"`. On Railway: if you ever see
   web/api crash-looping right after removing the secret, the guard is working.
   **Never "fix" a boot loop by leaving the secret unset.**
2. **`TRIPWIRE_DISABLE_EXEMPTION=true` is refused in production.**
   `exemptionFlagRefusedInProd` (apps/worker) ignores the flag under
   `NODE_ENV=production` so maintainer/org exemption cannot be silently disabled
   in prod. **Do not set `TRIPWIRE_DISABLE_EXEMPTION` on the worker.** If it is
   set, the worker logs the refusal and keeps exemption ON.

---

## 3. PlanetScale (Unit 3)

**Do not deploy the api/worker against the production DB until
`bun run verify:planetscale` passes.** Two invariants a pooler can silently
break gate the cutover; the script asserts both and exits non-zero on failure.

### 3a. Two connection strings — pooled + direct

PlanetScale Postgres serves through a connection pooler. LISTEN/NOTIFY needs a
persistent SESSION, which a transaction-mode pooler drops. So the app uses TWO
URLs (`createDirectPool` in `@tripwire/db`):

- **`DATABASE_URL` — the POOLED endpoint.** Everything transactional and query:
  the webhook `INSERT + enqueue` transaction, rule reads, web queries, pg-boss.
- **`DATABASE_URL_DIRECT` — the DIRECT / session endpoint.** ONLY the SSE
  stream's `LISTEN` (api) and the worker's `NOTIFY`. Unset ⇒ falls back to
  `DATABASE_URL` (local dev, one Postgres, no pooler — unchanged).

**FIRST confirm PlanetScale Postgres exposes a direct/non-pooled endpoint at
all.** If it does not, this two-URL design is impossible — **STOP and report;
do not deploy.** The polling fallback is a spec decision, not a default.

### 3b. Create the database + branch, migrate

```sh
# (owner, authenticated pscale/psql — creds never enter an agent session)
# 1. Create the prod database in the colocated region (§4), get the two URLs:
#    - pooled  → DATABASE_URL
#    - direct  → DATABASE_URL_DIRECT
# 2. Run migrations against the pooled URL from the repo root:
DATABASE_URL='<planetscale-pooled-url>' bun run db:migrate
#    → "migrations applied". This installs the drizzle schema. pg-boss installs
#      its own schema on first boss.start() (api/worker boot, or verify below).
```

### 3c. Gate — `bun run verify:planetscale`

Run while **no worker is consuming** the prod queue (before cutover), so the
affinity commit-probe's job is never picked up mid-check.

```sh
DATABASE_URL='<pooled-url>' DATABASE_URL_DIRECT='<direct-url>' bun run verify:planetscale
```

It asserts, exiting non-zero on any failure:
- **A. Transaction affinity (pooled URL).** Runs the real ingest (INSERT event +
  pg-boss enqueue in one tx) and confirms it commits atomically; then a second
  attempt is **ROLLED BACK** and it proves NEITHER the event row NOR the job
  survived. If either survives, the pooler broke transaction affinity
  (statement-level pooling) → switch the pooled endpoint to transaction/session
  pooling and re-run. (pg-boss also installs its schema here.)
- **B. LISTEN/NOTIFY (direct URL).** Opens a `LISTEN`, fires a `NOTIFY` from a
  second connection, asserts the payload arrives within 7s. **If B fails the
  script STOPS and says so — it does NOT fall back to polling.** Report and wait.

Both must print ✓ and the script must exit 0 before cutover.

---

## 4. Region pair (colocate — pg-boss polls and the rules are chatty)

pg-boss polls the queue and every rule read is a query; a cross-continent hop
taxes every one. Colocate the Railway region with the PlanetScale region:

- **Recommended pair: Northern Virginia.** Railway `us-east4` (GCP, Virginia) +
  PlanetScale Postgres AWS `us-east-1` (N. Virginia). Same metro, single-digit-ms
  cross-provider hop.
- Owner confirms exact availability at create time; if Virginia is unavailable on
  either side, pick any single metro both offer and record the pair here. **The
  region is chosen once, at DB + service creation — moving later means a
  migration.**

---

## 5. Cut over — see Unit 4

Deploy order, webhook repoint, `APP_URL`, the 7-step smoke test, and rollback are
in **Unit 4** below.

---

## Rollback

- **Bad deploy (any service):** Railway → the service → Deployments → the last
  known-good deployment → **Redeploy**. Instant; Railway keeps prior images.
- **Bad app change:** revert the commit and push; Railway rebuilds from the new
  HEAD (watch patterns rebuild only affected services).
- **Webhook regression:** repoint the GitHub App webhook back to the cloudflared
  tunnel URL (§ Unit 4) — the local worker resumes handling deliveries. The DB is
  shared only if you point local dev at prod (you don't; local uses compose
  Postgres), so a repoint is a clean fallback to the pre-deploy world.
- **DB:** PlanetScale keeps branches/backups; restore from a branch or backup.
  Migrations are forward-only (drizzle) — a bad migration is rolled back by
  restoring, not by a down-migration (there are none).
