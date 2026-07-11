---
description: Naming and import conventions — file casing, symbol casing, rule-id versioning, import order and absolute-path rules. Load when creating files or writing imports.
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Naming & imports (§9)

## Casing
- Files **kebab-case**: `event-list.tsx`, `account-age.ts` — including files in
  `utils` and `core`.
- Components **PascalCase**. Hooks `use-*`. Constants **SCREAMING_SNAKE_CASE**.
- Interfaces/types **PascalCase**, props types suffixed: `EventListProps`.
- Rule ids **kebab-case with a version**: `account-age@1`.
- DB columns **snake_case** (Drizzle maps to camelCase in code).

## Barrels
- Add a barrel `index.ts` at **3+ exports**.
- **Never re-export from a non-barrel file.**

## Imports
- Absolute always: `#/` inside `apps/web` (imports field), `@tripwire/*` across
  packages. **Never** relative `../../..`.
- `import type` for type-only imports (repo runs `verbatimModuleSyntax`).
- Import order: react/core → external → `@tripwire/ui` → `#/lib` →
  stores/queries → feature → CSS.
