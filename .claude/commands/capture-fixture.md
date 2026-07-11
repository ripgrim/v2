---
description: Take a raw payload (events table, quarantined parse failure, or pasted), scrub PII/tokens, file it under forge-github/fixtures with provenance, and wire it into the contract-test corpus.
argument-hint: <source>
---

Capture a fixture from `$ARGUMENTS`. This is the ONLY sanctioned way to add a
fixture — fixtures are captured real payloads, NEVER hand-written from docs
(`.claude/rules/testing.md`).

`<source>` is one of: a `delivery_id` / event id in the `events` table, a
quarantined parse-failure reference, or a pasted raw payload / API response.

Steps:
1. Load the raw payload from the given source. If pasted, take it verbatim.
2. **Scrub** PII and secrets: tokens, installation credentials, private emails,
   auth headers — but preserve the shape and every field the parser reads. Note
   what was scrubbed.
3. File it under `packages/forge-github/fixtures/` with a clear name (event kind
   + short slug) and a provenance sidecar: where it came from, when, what was
   scrubbed, and why it was captured (e.g. "parse failure on 2026-07-…").
4. Wire it into the **contract-test corpus** so it parses + normalizes against
   `@tripwire/contracts` on every PR. If it was a parse failure, the new test
   should fail first, then pass once the schema/normalizer is fixed.
5. Run `bun test` for the contract layer and report. Never mutate an existing
   raw payload — append-only.
