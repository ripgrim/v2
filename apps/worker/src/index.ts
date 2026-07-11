import {
	createBoss,
	createDb,
	PROCESS_EVENT_QUEUE,
	type ProcessEventJob,
	repoServices,
} from "@tripwire/db";
import { GithubReads, InstallationTokenCache } from "@tripwire/forge-github";
import pino from "pino";
import type { WorkerReads } from "./context.ts";
import { processEvent } from "./jobs/process-event.ts";

/**
 * @tripwire/worker — pg-boss consumers, where I/O meets the pure core. Request
 * ids (the event id) thread through every log line.
 */
if (import.meta.main) {
	const logger = pino({ name: "worker" });
	const { db, pool } = createDb();
	const boss = await createBoss();

	const appId = process.env.GITHUB_APP_ID;
	const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
	let reads: WorkerReads | null = null;
	if (appId && privateKey) {
		const tokens = new InstallationTokenCache({ appId, privateKey });
		reads = new GithubReads({
			tokenFor: async (repoFullName) => {
				const repo = await repoServices.getRepoByFullName(db, repoFullName);
				if (!repo?.installationId) {
					throw new Error(`no installation for ${repoFullName}`);
				}
				return await tokens.getToken(repo.installationId);
			},
		});
	} else {
		logger.warn(
			"GITHUB_APP_* env missing — forge reads disabled, rules will skip",
		);
	}

	await boss.work<ProcessEventJob>(PROCESS_EVENT_QUEUE, async (jobs) => {
		for (const job of jobs) {
			await processEvent(
				{
					db,
					pool,
					reads,
					logger: logger.child({ eventId: job.data.eventId }),
				},
				job.data,
			);
		}
	});

	logger.info("worker consuming process-event");
}
