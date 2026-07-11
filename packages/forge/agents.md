# Forge Scope
Rules for `packages/forge/**`.
This package contains the ForgeAdapter interface and its types. NOTHING ELSE.
No helpers, no base classes, no utils — ever. Implementations are siblings
(`forge-github`, later `forge-gitlab`) and never import each other.
See `.claude/rules/architecture.md`.
