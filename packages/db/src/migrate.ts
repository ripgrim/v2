import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb, type Db } from "./client.ts";

const MIGRATIONS_FOLDER = new URL("../drizzle", import.meta.url).pathname;

/** Applies generated migrations — shared by the CLI and integration tests. */
export async function applyMigrations(db: Db): Promise<void> {
	await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

if (import.meta.main) {
	const { db, pool } = createDb();
	await applyMigrations(db);
	await pool.end();
	process.stdout.write("migrations applied\n");
}
