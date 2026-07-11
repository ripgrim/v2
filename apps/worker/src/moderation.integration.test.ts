import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { WorkflowDefinition } from "@tripwire/contracts";
import {
	applyMigrations,
	createBoss,
	createDb,
	createTestDatabase,
	type Db,
	eventServices,
	moderationServices,
	repoServices,
	type TestDatabase,
} from "@tripwire/db";
import type { Pool } from "pg";
import type { PgBoss } from "pg-boss";
import pino from "pino";
import { processEvent } from "./jobs/process-event.ts";
import { resumeRun } from "./jobs/resume-run.ts";

/**
 * §6 — the moderation queue IS a paused run: needs_review halts the run and
 * creates an item; approve/deny resumes down the corresponding edge; the
 * audit trail and PR surface behave like any automatic outcome.
 */
let container: TestDatabase;
let db: Db;
let pool: Pool;
let boss: PgBoss;
const logger = pino({ level: "silent" });

const MODERATED: WorkflowDefinition = {
	id: "moderated@1",
	name: "moderated gate",
	version: 1,
	nodes: [
		{ id: "t", type: "trigger", kinds: ["change-request.opened"] },
		{
			id: "age",
			type: "rule",
			ref: "account-age@1",
			config: { minDays: 30 },
		},
		{ id: "mod", type: "action", action: "send-to-moderation" },
		{ id: "block", type: "action", action: "block" },
	],
	edges: [
		{ id: "e1", from: "t", to: "age" },
		{ id: "e2", from: "age", to: "mod", when: "fail" },
		{ id: "e3", from: "mod", to: "block", when: "deny" },
	],
};

beforeAll(async () => {
	container = await createTestDatabase();
	({ db, pool } = createDb(container.url));
	await applyMigrations(db);
	boss = await createBoss(container.url);
}, 120_000);

afterAll(async () => {
	await boss?.stop({ close: true, graceful: false }).catch(() => undefined);
	await pool?.end().catch(() => undefined);
	await container?.stop();
});

const freshReads = {
	getDiff: () => Promise.resolve([]),
	getCommits: () => Promise.resolve([]),
	getContributorProfile: () =>
		Promise.resolve({
			login: "sockpuppet",
			externalId: "999",
			createdAt: new Date(Date.now() - 86_400_000).toISOString(),
			followers: 0,
			following: 0,
			publicRepos: 0,
			profileText: null,
			mergedInRepo: 0,
			recentChangeRequestTimes: [],
			isOrgMember: false,
			isMaintainer: false,
		}),
};

const deps = () => ({
	db,
	pool,
	logger,
	reads: freshReads,
	adapter: null,
	makeGenerate: null,
	appUrl: "https://tripwire.sh",
});

describe("moderation queue = paused run", () => {
	test("needs_review pauses the run and creates a pending item", async () => {
		const raw = await Bun.file(
			new URL(
				"../../../packages/forge-github/fixtures/pull_request.opened.json",
				import.meta.url,
			).pathname,
		).json();
		const repoId = await repoServices.ensureRepo(db, {
			externalId: "186853002",
			owner: "Codertocat",
			name: "Hello-World",
			fullName: "Codertocat/Hello-World",
		});
		await repoServices.saveWorkflowDefinition(db, repoId, MODERATED);

		const { eventId } = await eventServices.insertRawEvent(pool, boss, {
			deliveryId: "mod-1",
			rawKind: "pull_request",
			raw,
		});
		if (!eventId) {
			throw new Error("insert failed");
		}
		await processEvent(deps(), { eventId });

		const run = await pool.query(
			"SELECT id, status, verdict FROM runs WHERE event_id = $1",
			[eventId],
		);
		expect(run.rows[0].status).toBe("paused");
		expect(run.rows[0].verdict).toBe("needs_review");

		const items = await moderationServices.listPendingItems(db);
		expect(items).toHaveLength(1);
		expect(items[0]?.runId).toBe(run.rows[0].id);
		expect(items[0]?.nodeId).toBe("moderated@1:mod");
		expect(items[0]?.actorLogin).toBe("Codertocat");
	});

	test("deny resumes down the deny edge ⇒ block; item decided; surface re-emitted", async () => {
		const items = await moderationServices.listPendingItems(db);
		const item = items[0];
		if (!item) {
			throw new Error("no pending item");
		}
		const decided = await moderationServices.decideModerationItem(pool, boss, {
			itemId: item.id,
			decision: "deny",
			decidedBy: null,
		});
		expect(decided).toBe(true);

		await resumeRun(deps(), { itemId: item.id, decision: "deny" });

		const run = await pool.query(
			"SELECT status, verdict FROM runs WHERE id = $1",
			[item.runId],
		);
		expect(run.rows[0].status).toBe("completed");
		expect(run.rows[0].verdict).toBe("block");

		const steps = await pool.query(
			"SELECT node_id, status FROM run_steps WHERE run_id = $1 AND node_id LIKE '%:resume'",
			[item.runId],
		);
		expect(steps.rowCount).toBeGreaterThanOrEqual(1);

		const actions = await pool.query(
			"SELECT kind FROM run_actions WHERE run_id = $1 ORDER BY kind",
			[item.runId],
		);
		const kinds = actions.rows.map((r) => r.kind);
		expect(kinds).toContain("block");
		expect(kinds.filter((k) => k === "comment").length).toBe(2);

		expect(await moderationServices.listPendingItems(db)).toHaveLength(0);

		const second = await moderationServices.decideModerationItem(pool, boss, {
			itemId: item.id,
			decision: "approve",
			decidedBy: null,
		});
		expect(second).toBe(false);
	});
});
