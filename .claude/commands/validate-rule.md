---
description: Auditor pair for /add-rule — re-reads a rule, its schemas, registry entry, tests and fixtures, checks the §6 laws, reports critical/warning/suggestion, then fixes.
argument-hint: <name> [fix=true|false]
---

Audit the rule `$ARGUMENTS` in `@tripwire/core`. This is the validator pair to
`/add-rule` — a DIFFERENT procedure than the one that created it (AGENTS.md).
Parse `[fix=true|false]` from the arguments; default `fix=false` (report only).

Re-read from scratch: `packages/core/src/rules/<name>.ts`, its config + result
schemas, its `registry.ts` entry, its tests, and EVERY fixture it touches.

Check the §6 laws (`.claude/rules/rules-engine.md`):
- **Versioning:** id is `<name>@<version>`; registry keyed by `id@version`; a
  material semantic change since the last version would require a bump.
- **Evidence:** `resultSchema` carries a typed, documented evidence payload —
  not just a boolean.
- **Purity:** `evaluate` reads only `RuleContext`; no I/O, no db, no forge, no
  AI SDK, no octokit, no env; imports limited to contracts + utils.
- **Skipped-not-thrown:** un-evaluatable returns `{ status: 'skipped', reason }`;
  throws only for bugs.
- **Determinism:** same context ⇒ same result; a property test covers it.
- **Registry:** the rule is reachable through the registry, not bypassed.

Report findings grouped **critical / warning / suggestion**. If `fix=true`, apply
the fixes (never widen scope — bump a version only if a law demands it) and re-run
`bun test` for the rule. If `fix=false`, stop after the report.
