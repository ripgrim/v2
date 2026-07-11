# DB Scope
Rules for `packages/db/**`.
Persistence + the service layer. Logic has a home here so route handlers and
server functions stay thin. All three heads (web, api, worker) call these
services.

HARD RULES:
- snake_case columns (Drizzle maps to camelCase), `timestamptz` always.
- Every jsonb column has a `@tripwire/contracts` schema validated ON WRITE.
- IDs are UUIDv7 via `generateId()` from `@tripwire/utils` — never raw uuid libs.
- Append-only is sacred: raw event payloads are never mutated or deleted.
- `insertRawEvent` is ONE transaction: insert raw event + enqueue pg-boss job.
  `UNIQUE(delivery_id)` makes redelivery a no-op.

Services may split into `packages/services` if they outgrow db.
**Do not create that package before then.**
See `.claude/rules/architecture.md`, `.claude/rules/ingest.md`.
