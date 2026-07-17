---
description: The testing closed loop — fixture policy (captured, never invented), the six test layers, verdict replay gate. Load when writing tests, fixtures, or touching core/rules.
paths:
  - "**/*.test.ts"
  - "packages/core/**"
  - "packages/forge-github/**"
  - "packages/db/**"
---

# Testing — the closed loop (§11)

**Never hand-write what reality can hand you.** Fixtures are captured real
payloads (scrubbed) — including GitHub *API responses*, not just webhooks. Never
invented from docs. Production parse failures auto-become fixture candidates.
Every incident ends with a fixture. The suite only gets harder to pass. Add
fixtures ONLY via `/capture-fixture`.

**One exception: authored adversarial eval fixtures.** The ai-review eval
(`scripts/eval/fixtures.ts`) uses hand-built PR scenarios, including prompt
injection and malice. You cannot capture an attack you have not yet taken, and
waiting to be attacked to write the fixture is backwards for a gatekeeper. These
share the event/diff vocabulary but never enter the replay corpus.

| Layer | When | What |
|---|---|---|
| Unit | every PR, seconds | rules + scorer as pure fns over fixture contexts; **property tests** (fast-check): score ∈ [0,100], red flags never raise scores, determinism |
| Contract | every PR | full fixture corpus parses + normalizes against `@tripwire/contracts` |
| Snapshot | every PR | rendered PR comments / verdict markdown vs golden files |
| Integration | every PR, ~1 min | REAL Postgres (testcontainer): webhook → tx → pg-boss → run persisted; fire same delivery-id twice ⇒ one row. **Never mock Postgres** — the tx + constraints ARE the logic |
| Verdict replay | CI gate on `core` changes | rerun candidate engine over event history, diff verdicts, human reviews the flips (`/replay`) |
| Live E2E | nightly / pre-release only | sacrificial repo + test account; real PR ⇒ comment lands, deep link resolves |

- Rules are pure functions ⇒ unit-tested over fixture `RuleContext`s. Expected
  outcomes are values (`{ status: 'skipped' }`), not thrown errors.
- CI (typecheck + biome + boundary check + tests) runs from the **first commit** —
  retrofit CI is how half-baked tests happen again.
- Shadow mode (post-launch): new rule versions record verdicts without acting;
  promote only after comparing shadow vs live.
