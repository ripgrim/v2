/**
 * @tripwire/worker — the muscle, where I/O meets the pure core.
 *
 * pg-boss consumers: normalize → match workflows → build `RuleContext` via the
 * adapter → core executor → persist run+steps → actions → upsert comment. The
 * ONLY package that imports `@tripwire/core`. Planned surface (spec §4):
 * `jobs/process-event.ts`, `jobs/rollup.ts`, `jobs/replay.ts`, `notify.ts`.
 *
 * Scaffolded empty in build step 1; consumers land in build step 4.
 */
export {};
