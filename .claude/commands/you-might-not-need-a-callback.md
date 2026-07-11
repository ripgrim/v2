---
description: Audit for misused useCallback — callbacks memoized for no consumer, unstable deps, wrapping that adds noise without a referential-stability need. Fixes or proposes.
argument-hint: [scope] [fix=true|false]
---

Audit `[scope]` (default: working-tree changes) for **misused `useCallback`**.
Parse `[fix=true|false]`; default `fix=false`.

Read the relevant react.dev guidance (`useCallback`) first.

Flag:
- `useCallback` whose result is not a dependency of any memoized child, effect,
  or hook — i.e. referential stability buys nothing; drop it.
- Callbacks with unstable deps that defeat the memoization.
- `useCallback` used where the cleaner fix is moving the function out of the
  component or lifting state.
- Missing `useCallback` where a function IS a dependency and its instability
  causes real re-runs — flag that direction too.

For each finding: file:line, the problem, the fix. If `fix=true`, apply and
re-typecheck; else propose only. No new deps, no scope creep.
