---
description: Audit components against @tripwire/ui primitives + the tripwire-design skill — primitives not re-derived, chrome via props not className, correct components/<feature>/<part> placement.
argument-hint: [scope]
---

Audit the components in `[scope]` (default: working-tree changes) against the
design system. Invoke the `tripwire-design` skill for the token/spacing/radius/
motion reference. Report-only unless the user asks to fix.

Check (per `.claude/rules/frontend.md` + `packages/ui/agents.md`):
- **Primitives not re-derived:** buttons, inputs, cards, dialogs, badges, chart
  shells come from `@tripwire/ui`. Flag any local reimplementation.
- **Chrome via props, not `className`:** a consumer reaching for `className` to
  change a primitive's chrome is a smell — the primitive should expose a prop.
- **Placement:** custom app composition lives in
  `apps/web/src/components/<feature>/<part>`; primitives live in `@tripwire/ui`.
  Flag app logic or data fetching that leaked into `ui`, and primitives that
  leaked into `apps/web`.
- **Design fidelity:** tokens, spacing scale, radius, and motion match the
  tripwire-design skill — no invented hues, no off-scale spacing, no ad-hoc
  easings.
- **Extraction thresholds:** extract at 50+ lines / 2+ uses / owns state; inline
  when <10 lines, single-use, presentational.

Report findings grouped by file with file:line and the specific rule. Offer to
fix; apply only if asked. No scope creep.
