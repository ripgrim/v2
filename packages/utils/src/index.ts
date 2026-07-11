/**
 * @tripwire/utils — shared helpers so agents never redefine them.
 *
 * Planned surface (spec §4): `generateId()` (UUIDv7 — never `crypto.randomUUID`
 * / nanoid directly), `toError` / `getErrorMessage`, `sleep`, `truncate`,
 * `backoffWithJitter`. Check here before writing any inline helper; a helper
 * used by 2+ files moves here.
 *
 * Scaffolded empty in build step 1. Helpers land as later steps need them.
 */
export {};
