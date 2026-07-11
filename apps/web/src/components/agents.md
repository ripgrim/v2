# Components Scope
Rules for `apps/web/src/components/**`.
Custom app-specific composition. Organized `components/<feature>/<part>` (home,
events, runs, rules, workflows/editor, moderation, layout, …).

HARD RULES:
- Primitives belong in `@tripwire/ui`, not here. Import them; don't re-derive.
- Extract a component when it hits 50+ lines, is used in 2+ files, or owns state.
  Keep it inline when <10 lines, single-use, presentational.
- Keep `useEffect` down: server sync → a query; derived state → `useMemo`;
  stable callback deps → refs.
- Audited via /ui-review against `@tripwire/ui` + the tripwire-design skill.

See `.claude/rules/frontend.md`, `.claude/rules/naming.md`.
