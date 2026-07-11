---
description: Composite React/UI audit — chains the four you-might-not-need auditors, then react-query-best-practices, then ui-review, and summarizes findings across all passes.
argument-hint: [scope] [fix=true|false]
---

Run the full cleanup chain over `[scope]` (default: the working-tree changes; a
path or feature narrows it). Parse `[fix=true|false]`; default `fix=false`.

Run these in order, forwarding `[scope]` and `[fix]` to each:
1. `/you-might-not-need-an-effect [scope] [fix]`
2. `/you-might-not-need-a-memo [scope] [fix]`
3. `/you-might-not-need-a-callback [scope] [fix]`
4. `/you-might-not-need-state [scope] [fix]`
5. `/react-query-best-practices [scope] [fix]`
6. `/ui-review [scope]`

Then produce ONE consolidated summary across all passes: findings grouped by
auditor and by file, what was fixed vs what was left (and why), and any items
that need Grim's judgment. If `fix=false`, everything is report-only. Do not
widen scope beyond `[scope]`.
