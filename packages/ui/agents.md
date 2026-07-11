# UI Scope
Rules for `packages/ui/**`.
Design-system PRIMITIVES only, lifted from the redesign demo.

HARD RULES:
- No app logic, no data fetching, no domain types (nothing from
  `@tripwire/contracts`). Primitives are props-driven chrome.
- A consumer reaching for `className` to change chrome is a smell — expose a prop.
- Custom app-specific composition lives in `apps/web/src/components`, not here.
- Match the demo's aesthetic via the `tripwire-design` skill; don't invent a look.

See `.claude/rules/frontend.md` and `.claude/skills/tripwire-design/`.
