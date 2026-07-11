---
description: Audit for misused useMemo — memoizing trivial computations, unstable deps that defeat it, memo used where the real fix is structural. Fixes or proposes.
argument-hint: [scope] [fix=true|false]
---

Audit `[scope]` (default: working-tree changes) for **misused `useMemo`**. Parse
`[fix=true|false]`; default `fix=false`.

Read the relevant react.dev guidance (`useMemo`, and "You Might Not Need an
Effect" for the derived-state overlap) first.

Flag:
- `useMemo` around cheap computations where the memo costs more than it saves.
- Memos with unstable dependencies (new object/array/fn literals) that never hit.
- Memo used to paper over a component that should be split or a value that should
  be computed higher up.
- Cases where the honest fix is `useMemo` but the code recomputes in render or in
  an effect instead — flag those too.

For each finding: file:line, the problem, the fix. If `fix=true`, apply and
re-typecheck; else propose only. No new deps, no scope creep.
