import { PgBoss } from "pg-boss";

/** The single queue name for ingest → worker handoff (§5). */
export const PROCESS_EVENT_QUEUE = "process-event";

export interface ProcessEventJob {
	eventId: string;
}

/**
 * One PgBoss per process. `start()` installs the pgboss schema and runs
 * maintenance; `createQueue` is idempotent. The api head only sends (inside
 * the ingest transaction); the worker heads consume.
 */
export async function createBoss(
	databaseUrl = process.env.DATABASE_URL,
): Promise<PgBoss> {
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not set");
	}
	const boss = new PgBoss({ connectionString: databaseUrl });
	await boss.start();
	await boss.createQueue(PROCESS_EVENT_QUEUE);
	return boss;
}
