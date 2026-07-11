---
description: Audit for unnecessary useState — values derivable from props/other state, server data held in local state, redundant state that should be computed or lifted. Fixes or proposes.
argument-hint: [scope] [fix=true|false]
---

Audit `[scope]` (default: working-tree changes) for **unnecessary `useState`**.
Parse `[fix=true|false]`; default `fix=false`.

Read react.dev's "Choosing the State Structure" and "You Might Not Need an
Effect" first.

Flag:
- State that mirrors a prop or is fully derivable from other state/props →
  compute in render / `useMemo`, don't store.
- Server data kept in `useState` → belongs in a **TanStack Query** cache.
- Redundant or contradictory state that could be a single source of truth.
- State that should be lifted (or colocated) rather than duplicated.
- State paired with a syncing effect — the effect is the tell.

For each finding: file:line, the problem, the fix. If `fix=true`, apply and
re-typecheck; else propose only. No new deps, no scope creep.
