/**
 * @tripwire/core — the pure engine.
 *
 * HARD LAW: this package is pure. No I/O, no db, no forge, no AI SDK, no
 * octokit, no env vars. Imports contracts + utils ONLY. Effects arrive injected
 * via `RuleContext` / `generate()`. Expected outcomes are values, not
 * exceptions; a rule that can't evaluate returns `{ status: 'skipped', reason }`.
 *
 * Planned surface (spec §6): `rules/`, `workflow/`, `scoring/`, `context.ts`.
 * Scaffolded empty in build step 1; rules land in build step 5 via /add-rule.
 */
export {};
