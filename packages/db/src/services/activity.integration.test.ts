import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { DEFAULT_WORKFLOW } from "@tripwire/contracts";
import {
	applyMigrations,
	createDb,
	createTestDatabase,
	type Db,
	type TestDatabase,
} from "../index.ts";
import { events } from "../schema/events.ts";
import { getActivityForEvent, listActivity } from "./events.ts";
import { createRun, recordSteps } from "./runs.ts";

/**
 * §9 activity feed — the events⋈runs join. A gated event carries its run's
 * verdict + the first failing rule's one-liner; an ungated event (a push, an
 * exempt change request) carries no run.
 */
let container: TestDatabase;
let db: Db;
let pool: { end(): Promise<void> };

const NORMALIZED = (kind: string) => ({
	id: "",
	kind,
	occurredAt: "2026-07-12T00:00:00.000Z",
	actor: { login: "sockpuppet", avatarUrl: null },
	repo: { fullName: "acme/x", externalId: "1" },
	changeRequest: {
		number: 1,
		title: "t",
		headSha: "abc",
		baseBranch: "main",
		headBranch: "f",
	},
});

async function seedEvent(id: string, kind: string): Promise<void> {
	await db.insert(events).values({
		id,
		deliveryId: `d-${id}`,
		rawKind: "pull_request",
		raw: {},
		kind,
		repoFullName: "acme/x",
		actorLogin: "sockpuppet",
		normalized: { ...NORMALIZED(kind), id },
		normalizedAt: new Date(),
	});
}

beforeAll(async () => {
	container = await createTestDatabase();
	({ db, pool } = createDb(container.url));
	await applyMigrations(db);
}, 120_000);

afterAll(async () => {
	await pool?.end().catch(() => undefined);
	await container?.stop();
});

describe("listActivity — events joined to runs", () => {
	test("a gated event carries its run verdict + leading fail reason", async () => {
		await seedEvent("evt-run", "change-request.opened");
		const runId = await createRun(db, {
			eventId: "evt-run",
			repoFullName: "acme/x",
			subjectNumber: 1,
			headSha: "abc",
			snapshot: [DEFAULT_WORKFLOW],
			status: "completed",
			verdict: "block",
		});
		const at = "2026-07-12T00:00:00.000Z";
		await recordSteps(db, runId, [
			{
				nodeId: "default@1:crypto",
				nodeKind: "rule",
				ruleRef: "crypto-address@1",
				status: "fail",
				input: {},
				output: {
					ruleId: "crypto-address",
					version: 1,
					status: "evaluated",
					passed: false,
					evidence: { matches: [] },
					evaluatedAt: at,
				},
				summary: "found 2 crypto addresses in DONATE.md",
				startedAt: at,
				finishedAt: at,
				durationMs: 1,
			},
		]);

		const page = await listActivity(db, {});
		const row = page.items.find((i) => i.event.id === "evt-run");
		expect(row?.run?.verdict).toBe("block");
		expect(row?.run?.status).toBe("completed");
		expect(row?.run?.reason).toBe("found 2 crypto addresses in DONATE.md");
		expect(row?.run?.runId).toBe(runId);
	});

	test("an ungated event carries no run", async () => {
		await seedEvent("evt-none", "push");
		const row = await getActivityForEvent(db, "evt-none");
		expect(row?.run).toBeNull();
		expect(row?.event.id).toBe("evt-none");
	});

	test("getActivityForEvent returns null for an unknown event", async () => {
		expect(await getActivityForEvent(db, "nope")).toBeNull();
	});
});
