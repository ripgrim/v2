---
description: Audit TanStack Query hooks against §9 — key factories, staleTime, signal forwarding, keepPreviousData placement, targeted invalidation, onSettled reconciliation. Fixes or proposes.
argument-hint: [scope] [fix=true|false]
---

Audit the TanStack Query usage in `[scope]` (default: working-tree changes)
against §9 (`.claude/rules/frontend.md`). Parse `[fix=true|false]`; default
`fix=false`.

Check each query/mutation for:
- **Key factories:** hierarchical per domain (`all → lists() → list(x) →
  details() → detail(id)`). No ad-hoc inline key arrays.
- **`staleTime`:** explicit on every query. Flag defaults-by-omission.
- **`signal`:** forwarded into the fetcher / server function for cancellation.
- **`keepPreviousData`:** only on variable-key queries; flag it elsewhere.
- **Invalidation:** targeted (specific keys), not blanket `invalidateQueries()`.
- **Optimistic updates:** reconcile in **`onSettled`**, not `onSuccess`.
- **Source of truth:** server data comes through Query fed by server functions →
  `@tripwire/db` services; no `useState` + `fetch`, no internal REST.
- SSE merges into the cache, not a parallel state system.

For each finding: file:line, the rule violated, the fix. If `fix=true`, apply and
re-typecheck; else propose only. No new deps, no scope creep.
