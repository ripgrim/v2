/**
 * @tripwire/contracts — the shared language.
 *
 * Zod schemas + inferred types, extracted from the redesign demo's mock data.
 * The demo's shapes are the contract; the backend's job is to satisfy them.
 * No functions, no I/O, no deps except zod.
 *
 * Domains mirror the demo's mock data. The spec §4 backend contracts
 * (events, runs, rules, review, workflow) land as later build steps add the
 * shapes they describe — see DECISIONS.md.
 */

export * from "./automod.ts";
export * from "./contributor.ts";
export * from "./integrations.ts";
export * from "./log.ts";
export * from "./moderation.ts";
export * from "./repo-analytics.ts";
export * from "./repo-content.ts";
