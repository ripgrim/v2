# Worker Scope
Rules for `apps/worker/**`.
pg-boss consumers — where I/O meets the pure core. The ONLY package that imports
`@tripwire/core`.

HARD RULES:
- The pipeline (spec §5): parse raw with contracts (parse failure = quarantine +
  fixture candidate) → write NormalizedEvent + NOTIFY → match workflows by
  trigger → build `RuleContext` via the adapter (ALL reads pre-fetched HERE) →
  core executor → persist run with a SNAPSHOT of the workflow definition →
  actions (recorded as rows first, marked executed after) → upsert PR comment.
- All effects live here; core stays pure. Inject `generate()` for `ai-review`.
- Never `console.log` — pino only, request IDs threaded from the ingest job.

See `.claude/rules/ingest.md`, `.claude/rules/rules-engine.md`,
`.claude/rules/review-agent.md`, `.claude/rules/architecture.md`.
