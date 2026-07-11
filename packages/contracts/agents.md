# Contracts Scope
Rules for `packages/contracts/**`.
This package is the shared language: Zod schemas + inferred types, extracted
from the redesign demo's mock data. **The demo's shapes are the contract; the
backend's job is to satisfy them.**

HARD RULES:
- No functions, no I/O, no side effects. Deps: `zod` ONLY.
- Every schema exports both the `zodSchema` and its `z.infer` type.
- Domain-internal validators elsewhere may use Zod locally, but the schemas that
  cross a boundary live here and nowhere else.
- jsonb columns in `@tripwire/db` validate against these schemas on write.

Changing a schema is changing the contract — the one thing Grim reviews by hand.
See `.claude/rules/architecture.md`.
