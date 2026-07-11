# VERIFICATION QUEUE — human tasks, in dependency order

Each item: what to do (exact commands/clicks), what SHOULD happen, and which
build-step *done-when* it closes. Work top to bottom; later items depend on
earlier ones. Machine-provable parts are already proven in all-summaries.md.

*(populated as steps land)*

## 1. Register the GitHub App (closes step 3 live setup)
1. github.com → Settings → Developer settings → GitHub Apps → New GitHub App.
2. Name: `tripwire-dev-<your-suffix>`. Homepage: `https://tripwire.sh` (any).
3. Webhook URL: leave placeholder for now (item 2 sets it). Webhook secret:
   generate one (`openssl rand -hex 32`) and put it in `.env` as
   `GITHUB_WEBHOOK_SECRET` (copy `.env.example` → `.env`).
4. Permissions (§13.3): Pull requests **Read & write** · Checks **Read &
   write** · Contents **Read-only** · Metadata **Read-only**.
5. Subscribe to events: **Pull request**, **Issue comment**. (Push comes free
   with contents; optional now.)
6. Create the App → note App ID → `.env` `GITHUB_APP_ID`. Generate a private
   key (.pem) → paste PEM into `.env` `GITHUB_APP_PRIVATE_KEY` (keep newlines,
   quote it).
7. Install the App on a **scratch repo** you own.
SHOULD HAPPEN: App exists, installed on scratch repo, `.env` filled.

## 2. Tunnel + webhook URL (closes step 3 done-when, first half)
1. `docker compose up -d postgres && bun run db:migrate`
2. `cd apps/api && bun run src/index.ts` (starts on :8787)
3. `cloudflared tunnel --url http://localhost:8787` → copy the
   `https://<random>.trycloudflare.com` URL.
4. GitHub App settings → Webhook URL = `https://<random>.trycloudflare.com/webhooks/github` → save.
SHOULD HAPPEN: GitHub "ping" delivery shows 200 in Advanced → Recent Deliveries.

## 3. PR ⇒ one events row; redelivery ⇒ still one (closes step 3 done-when)
1. Open a PR on the scratch repo.
2. `docker exec tripwire-postgres psql -U tripwire -d tripwire -c "select delivery_id, raw_kind, kind from events;"`
   SHOULD HAPPEN: exactly one row for the PR delivery.
3. GitHub App → Advanced → Recent Deliveries → the pull_request delivery →
   Redeliver.
4. Re-run the query. SHOULD HAPPEN: still exactly one row (response says
   `"duplicate": true`).
5. Afterwards, capture the real delivery as a fixture:
   `/capture-fixture <delivery_id>` — replaces the octokit-sourced fixtures
   with our own App's captures.

## 4. Live event list — PR appears without refresh (closes step 4 done-when)
Prereqs: items 1–3 done; postgres up; `.env` filled.
1. Terminal A: `cd apps/api && bun run src/index.ts`
2. Terminal B: `cd apps/worker && bun run src/index.ts`
3. Terminal C: `bun run dev` → open http://localhost:3000/events
4. Terminal D: cloudflared tunnel running (item 2).
5. Open a new PR (or push to an open one) on the scratch repo.
SHOULD HAPPEN: the event row appears at the top of /events within ~2s,
no refresh — first end-to-end proof.
