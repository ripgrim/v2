/**
 * @tripwire/db — persistence + the service layer.
 *
 * Drizzle schema + services. All three heads (web, api, worker) call these
 * services — logic lives here, never in route handlers or server functions.
 * Every jsonb column has a contracts schema validated ON WRITE.
 *
 * Planned surface (spec §4): `schema/`, `services/`, `client.ts`, `migrate.ts`,
 * `drizzle/`. Scaffolded empty in build step 1; schemas land in build step 2.
 */
export {};
