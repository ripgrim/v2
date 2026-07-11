---
description: Data ingestion — the webhook request path, the ONE transaction, idempotency by delivery_id, worker pipeline, append-only raw payloads. Load-bearing tx rules. Load when touching the webhook route or worker jobs.
paths:
  - "apps/api/src/routes/webhooks*"
  - "apps/api/src/routes/**"
  - "apps/worker/**"
  - "packages/db/src/services/events*"
---

# Data & ingestion (§5)

```
GitHub ──webhook──▶ apps/api POST /webhooks/github
  1. verify HMAC (forge-github/webhook/verify)          — reject ≠ 401
  2. ONE transaction: insert raw event + enqueue pg-boss job
  3. idempotency: UNIQUE(delivery_id) from X-GitHub-Delivery — redelivery = no-op
  4. return 200 in single-digit ms. NOTHING else in the request path.
──▶ worker process-event
  5. parse raw payload with contracts schemas (production IS a test execution —
     parse failure = quarantine event + auto-capture as fixture candidate + log)
  6. write NormalizedEvent, NOTIFY 'events'
  7. match enabled workflows by trigger for the repo
  8. build RuleContext through the adapter (all reads happen HERE, pre-fetched)
  9. core executor walks the DAG; every node's input/output recorded as run_steps
 10. persist run — SNAPSHOT the workflow definition onto the run (edits later must
     not change what a historical run page shows)
 11. multiple workflows fired on one event ⇒ JOIN into one run (one button on the PR)
 12. execute actions through the adapter — actions recorded as rows first, marked
     executed after (crash mid-run must not double-block on retry)
 13. upsert the PR comment (§7)
──▶ apps/api SSE fan-out (LISTEN 'events') ──▶ TanStack Query cache merge ──▶ UI live
```

Load-bearing invariants:
- **The request path does exactly steps 1–4.** A query, a fetch, or any rule
  logic in the handler is in the wrong layer. Everything else is the worker's job.
- **The insert + enqueue is one transaction.** No enqueue without the row; no row
  without the enqueue.
- **`UNIQUE(delivery_id)` is the idempotency guarantee.** Redelivery is a no-op,
  proven by an integration test that fires the same delivery-id twice ⇒ one row.
- **Actions are recorded before they execute**, marked executed after — retries
  must never double-act.
- **Append-only is sacred:** raw payloads are never mutated or deleted. They are
  the fixture library, the replay corpus, and the future ML dataset.
