# Forge-GitHub Scope
Rules for `packages/forge-github/**`.
The GitHub implementation of `@tripwire/forge`'s `ForgeAdapter`. Imports
`@tripwire/forge` (interface + types), `@tripwire/contracts`, `@tripwire/utils`.
NEVER imports a sibling adapter.

HARD RULES:
- Three responsibilities only: inbound (verify + normalize), reads (build
  `RuleContext` inputs), actions (block / label / comment / status, idempotently).
- `fixtures/` holds captured REAL payloads + API responses — never hand-written.
  Add fixtures ONLY via /capture-fixture (scrub PII/tokens first).
- The condensed PR comment (§7) lives in `actions/comment.ts`: one button, one
  sentence, upsert on `<!-- tripwire:run -->`. Never append.

See `.claude/rules/architecture.md`, `.claude/rules/ingest.md`,
`.claude/rules/testing.md`.
