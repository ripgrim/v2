---
description: The rules & workflow engine — defineRule primitive, the versioning law, evidence, purity/skipped policy, workflow DAG, moderation-as-paused-run. Load when working in core or on rules/workflows.
paths:
  - "packages/core/**"
---

# Rules & workflows engine (§6)

## Rule = a single boolean requirement
Every non-exempt user of a repo must meet it (org members / maintainers exempt).
Primitive: `defineRule({ id, version, configSchema, resultSchema, evaluate })`,
Zod config schema + Zod result schema + `evaluate(ctx, config)`. Results
serialize as validated JSON on the server; the typed registry (keyed `id@version`)
is what the SDK sees later — **types in code, JSON on the wire.**

Create rules ONLY via `/add-rule`; audit via `/validate-rule`.

## Purity is the law
Core is pure: no I/O, no db, no forge, no AI SDK, no octokit, no env vars.
Everything a rule reads is pre-fetched into `RuleContext` by the worker; effects
(like the review agent's `generate()`) are injected. Expected outcomes are
values, not exceptions — a rule that can't evaluate returns
`{ status: 'skipped', reason }`. Throws are reserved for bugs. One flaky forge
call degrades one rule's evidence, never the whole run.

## Versioning is the law
A stored run references `account-age@1` forever, even after `@2` ships with
different semantics. **Material change ⇒ bump the version.** Old runs must stay
interpretable. The registry is keyed by `id@version`.

## Evidence
Rule-specific typed payload (actual account age, the CoV value that tripped spray
detection). Evidence is what makes the run page and appeals real instead of
"computer says no." Document each rule's evidence shape.

## Workflow = node-based composition
Serialized as a JSON DAG in `contracts/workflow.ts`: trigger nodes (PR opened /
comment / push) → rule nodes → gate nodes (all-of / any-of / not) → action nodes
(block, comment, label, request-review, send-to-moderation). The executor is a
boring DAG walk: topo order, gate short-circuit, record every node's input/output
as `run_steps`. The engine is validated with hand-seeded definitions long before
the React Flow editor (built last) exists.

## Moderation queue = a paused run
`needs_review` halts the run and creates a moderation item; approve/deny resumes
down the corresponding edge. Audit trail, run page, and PR button behave
identically for moderated and automatic outcomes.
