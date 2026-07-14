import { PgBoss } from "pg-boss";

/** Ingest → worker handoff (§5). */
export const PROCESS_EVENT_QUEUE = "process-event";

export interface ProcessEventJob {
	eventId: string;
}

/** Moderation decision → worker resume (§6). */
export const RESUME_RUN_QUEUE = "resume-run";

export interface ResumeRunJob {
	itemId: string;
	decision: "approve" | "deny";
}

/** Arming → arm-time backfill (§4): replay stored events into real runs. */
export const BACKFILL_REPO_QUEUE = "backfill-repo";

export interface BackfillRepoJob {
	repoId: string;
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
	await boss.createQueue(RESUME_RUN_QUEUE);
	await boss.createQueue(BACKFILL_REPO_QUEUE);
	return boss;
}
