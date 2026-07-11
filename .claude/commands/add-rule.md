---
description: Scaffold a complete core rule via defineRule at @1 — schemas, registry entry, unit tests over fixture contexts, documented evidence shape.
argument-hint: <name>
---

Scaffold a new rule named `$ARGUMENTS` in `@tripwire/core`. This is the ONLY
sanctioned way to create a rule (freehand rule files are forbidden — see
AGENTS.md). Follow `.claude/rules/rules-engine.md` and `.claude/rules/testing.md`.

Steps:
1. **Refuse bad names.** Reject if `$ARGUMENTS` is not kebab-case, collides with
   an existing rule id, or would skip the registry. Stop and report.
2. Create `packages/core/src/rules/<name>.ts` using `defineRule({ id, version,
   configSchema, resultSchema, evaluate })`:
   - `id: "<name>"`, `version: 1` (id on the wire is `<name>@1`).
   - `configSchema` + `resultSchema` are Zod schemas. The result is a
     `RuleResult` envelope `{ ruleId, version, status, passed, evidence,
     evaluatedAt }`.
   - `evaluate(ctx, config)` is PURE: reads only from `RuleContext`, returns
     values. Un-evaluatable ⇒ `{ status: 'skipped', reason }`. Never throw for
     expected outcomes. No I/O, no imports outside contracts + utils.
3. Register it in `packages/core/src/rules/registry.ts` keyed by `id@version`.
4. Document the **evidence shape** in a TSDoc block on `resultSchema` — the
   typed payload that makes the run page and appeals real.
5. Write `packages/core/src/rules/<name>.test.ts`: unit tests as pure functions
   over fixture `RuleContext`s, including a skipped-path case and a determinism
   check. Use captured fixtures only — never invent payloads.
6. Do NOT bump to `@2` or edit other rules. New rule = new file at `@1`.
7. Run `bun test` for the new file and report. Remind the user to run
   `/validate-rule <name>` — additions are audited by a different procedure.
