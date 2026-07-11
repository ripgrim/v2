# Core Scope
Rules for `packages/core/**`.
HARD LAW: this package is pure. No I/O, no db, no forge, no AI SDK, no octokit,
no env vars. Effects arrive injected via RuleContext / generate().
Every rule is `id@version` with Zod config + result schemas. Bump the version on
any semantic change — stored runs reference versions forever.
New rules are created ONLY via /add-rule and audited via /validate-rule.
See `.claude/rules/rules-engine.md` and `.claude/rules/architecture.md`.
