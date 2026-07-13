import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.ts";

/**
 * One pool per process, sized for the three heads. LISTEN/NOTIFY consumers
 * (SSE, worker) create their own dedicated `pg` Client — a pooled connection
 * cannot hold a LISTEN.
 */
export function createDb(databaseUrl = process.env.DATABASE_URL) {
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not set");
	}
	const pool = new Pool({ connectionString: databaseUrl, max: 10 });
	return { db: drizzle(pool, { schema }), pool };
}

/**
 * A dedicated pool for LISTEN/NOTIFY (the SSE stream's LISTEN, the worker's
 * NOTIFY). Behind a connection pooler (PlanetScale in prod), LISTEN needs a
 * persistent SESSION — a transaction-pooled connection silently drops it and
 * the live feed dies — so these clients use `DATABASE_URL_DIRECT`, the
 * direct/session endpoint. Falls back to `DATABASE_URL` when unset, so local
 * dev (one Postgres, no pooler) is unchanged. Small `max`: a few long-lived
 * listeners plus fire-and-forget notifies.
 */
export function createDirectPool(
	directUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL,
) {
	if (!directUrl) {
		throw new Error("DATABASE_URL_DIRECT (or DATABASE_URL) is not set");
	}
	return new Pool({ connectionString: directUrl, max: 5 });
}

export type Db = ReturnType<typeof createDb>["db"];
export { schema };
