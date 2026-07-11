/**
 * @tripwire/api — thin Hono head.
 *
 * Webhook ingest + SSE now; zod-openapi public surface post-MVP. Handlers are
 * parse → service call → respond. A query in a route handler is in the wrong
 * layer. Planned surface (spec §4): `routes/webhooks.ts`, `routes/stream.ts`,
 * `middleware/auth.ts`.
 *
 * Scaffolded empty in build step 1; the ingest route lands in build step 3.
 */
export {};
