---
description: Audit components for unnecessary useEffect — data derivable during render, server sync that should be a query, event logic misfiled as an effect. Fixes or proposes.
argument-hint: [scope] [fix=true|false]
---

Audit `[scope]` (default: working-tree changes) for **unnecessary `useEffect`**.
Parse `[fix=true|false]`; default `fix=false`.

First read react.dev's "You Might Not Need an Effect"
(https://react.dev/learn/you-might-not-need-an-effect) and apply its taxonomy.

Flag effects that should be something else (per `.claude/rules/frontend.md`):
- Transforming data for render → compute during render / `useMemo`.
- Caching expensive derived state → `useMemo`.
- Resetting state on prop change → `key`, not an effect.
- Syncing server state → a **TanStack Query**, not `useState` + effect + fetch.
- Handling a user event → an event handler, not an effect.
- Chains of effects that set state that trigger more effects → collapse.

For each finding: file:line, which anti-pattern, the replacement. If `fix=true`,
apply the minimal change and re-typecheck; if `fix=false`, propose only. Never
introduce a new dependency or widen scope.
