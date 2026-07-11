# API Scope
Rules for `apps/api/**`.
Thin Hono head: webhook ingest + SSE now; public OpenAPI post-MVP.

HARD RULES:
- Handlers are parse → service call → respond. A query in a route handler is in
  the wrong layer — it belongs in `@tripwire/db` services.
- `POST /webhooks/github`: verify HMAC (reject ≠ 401) → ONE tx (insert raw +
  enqueue) → return 200 in single-digit ms. NOTHING else in the request path.
- SSE (`GET /events/stream`) fans out off Postgres LISTEN/NOTIFY.
- Never `console.log` — pino only, request IDs threaded into worker jobs.

See `.claude/rules/ingest.md` (load-bearing tx/idempotency rules),
`.claude/rules/architecture.md`.
