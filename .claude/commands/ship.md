---
description: Pre-flight (biome, typecheck, boundary check, tests) → conventional commit → push → PR, in Grim's voice. Confirms the message before executing.
argument-hint: [notes]
---

Ship the current work. `[notes]` are optional pointers for the PR body.

1. **Pre-flight — all must pass, in order. Stop on the first failure and report:**
   - `bun run check` (Biome)
   - `bun run typecheck`
   - `bun run check:boundaries`
   - `bun test`
2. If on the default branch, create a branch first (`type/short-slug`).
3. Stage the changes and draft a **conventional commit**:
   `type(scope): description` (feat/fix/chore/refactor/test/docs). Subject
   lowercase, terse, imperative.
4. Draft the commit body + PR description **in Grim's voice: terse, lowercase,
   direct bullets, no fluff, no marketing, zero exclamation marks. NO
   Co-Authored-By lines. No "generated with" trailers.** Wording follows
   `.claude/rules/constitution.md`.
5. **Show the user the branch, commit message, and PR body and CONFIRM before
   executing** anything that pushes.
6. On confirmation: commit, push, open the PR with `gh`. Report the PR URL.
