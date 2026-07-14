import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { generateId } from "@tripwire/utils";
import {
	applyMigrations,
	createDb,
	createTestDatabase,
	type Db,
	type TestDatabase,
} from "../index.ts";
import { forgeIdentities, user } from "../schema/auth.ts";
import { events } from "../schema/events.ts";
import { moderationItems } from "../schema/moderation.ts";
import { runs } from "../schema/runs.ts";
import {
	claimInstallationForForgeUser,
	getActiveRepo,
	getOnboardingState,
	linkUserInstallation,
	listSwitcherRepos,
	listUserRepos,
	setActiveRepo,
} from "./onboarding.ts";
import { removeInstallation, syncInstallationRepos } from "./repos.ts";

/**
 * §10 onboarding — the user ↔ installation ↔ active-repo links. An installation
 * belongs to exactly one user; the active repo must be one the user's
 * installation actually grants.
 */
let container: TestDatabase;
let db: Db;
let pool: { end(): Promise<void> };

async function seedUser(id: string): Promise<void> {
	await db.insert(user).values({ id, name: id, email: `${id}@example.com` });
}

async function seedRepo(
	installationId: string,
	externalId: string,
	fullName: string,
): Promise<void> {
	const [owner, name] = fullName.split("/");
	await syncInstallationRepos(
		db,
		installationId,
		[
			{
				externalId,
				owner: owner ?? fullName,
				name: name ?? fullName,
				fullName,
				private: false,
			},
		],
		[],
	);
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

describe("onboarding links", () => {
	test("link → list granted repos → pick active", async () => {
		await seedUser("u-1");
		await seedRepo("inst-1", "r-1", "acme/one");
		await seedRepo("inst-1", "r-2", "acme/two");

		const { claimed } = await linkUserInstallation(db, {
			userId: "u-1",
			installationId: "inst-1",
		});
		expect(claimed).toBe(true);

		const repos = await listUserRepos(db, "u-1");
		expect(repos.map((r) => r.fullName).sort()).toEqual([
			"acme/one",
			"acme/two",
		]);

		const state = await getOnboardingState(db, "u-1");
		expect(state.hasInstallation).toBe(true);
		expect(state.activeRepo).toBeNull();

		const picked = repos.find((r) => r.fullName === "acme/two");
		if (!picked) {
			throw new Error("expected acme/two");
		}
		expect(await setActiveRepo(db, "u-1", picked.id)).toBe(true);
		expect((await getActiveRepo(db, "u-1"))?.fullName).toBe("acme/two");
	});

	test("an installation belongs to exactly one user — no stealing", async () => {
		await seedUser("u-2");
		// u-1 already owns inst-1; u-2 trying to claim it is a no-op.
		const { claimed } = await linkUserInstallation(db, {
			userId: "u-2",
			installationId: "inst-1",
		});
		expect(claimed).toBe(false);
		expect(await listUserRepos(db, "u-2")).toHaveLength(0);
	});

	test("active repo must be one the user actually has", async () => {
		await seedUser("u-3");
		await seedRepo("inst-3", "r-3", "other/repo");
		await linkUserInstallation(db, {
			userId: "u-3",
			installationId: "inst-3",
		});
		// A repo from someone else's installation (acme/one → u-1) is refused.
		const foreign = (await listUserRepos(db, "u-1"))[0];
		if (!foreign) {
			throw new Error("expected u-1 repo");
		}
		expect(await setActiveRepo(db, "u-3", foreign.id)).toBe(false);
		expect(await getActiveRepo(db, "u-3")).toBeNull();
	});
});

describe("uninstall drops the installation link — no onboarding limbo", () => {
	test("removeInstallation clears hasInstallation so the user can reinstall", async () => {
		await seedUser("u-uninstall");
		await seedRepo("inst-uninstall", "r-un", "acme/uninstalled");
		await linkUserInstallation(db, {
			userId: "u-uninstall",
			installationId: "inst-uninstall",
		});

		const before = await getOnboardingState(db, "u-uninstall");
		expect(before.hasInstallation).toBe(true);
		expect(before.repos.map((r) => r.fullName)).toEqual(["acme/uninstalled"]);

		await removeInstallation(db, "inst-uninstall");

		// The link is gone (not just the repos), so onboarding offers the install
		// button again instead of spinning forever on "syncing…" with zero repos.
		const after = await getOnboardingState(db, "u-uninstall");
		expect(after.hasInstallation).toBe(false);
		expect(after.repos).toHaveLength(0);
	});
});

describe("listSwitcherRepos — a name plus SIGNAL, ranked by activity", () => {
	/** Give a repo a stored event, a blocked run, and a pending moderation item. */
	async function seedActivity(repoFullName: string): Promise<void> {
		const eventId = generateId();
		await db.insert(events).values({
			id: eventId,
			deliveryId: generateId(),
			rawKind: "pull_request",
			raw: {},
			repoFullName,
		});
		const runId = generateId();
		await db.insert(runs).values({
			id: runId,
			eventId,
			repoFullName,
			verdict: "block",
			workflowSnapshot: {},
		});
		await db.insert(moderationItems).values({
			id: generateId(),
			runId,
			nodeId: "gate",
			status: "pending",
		});
	}

	test("scoped to the user's installations, signal-carrying, active-first", async () => {
		await seedUser("u-sw");
		await seedRepo("inst-sw", "r-quiet", "sw/quiet");
		await seedRepo("inst-sw", "r-busy", "sw/busy");
		await linkUserInstallation(db, {
			userId: "u-sw",
			installationId: "inst-sw",
		});
		await seedActivity("sw/busy");

		const rows = await listSwitcherRepos(db, "u-sw");
		expect(rows.map((r) => r.fullName)).toEqual(["sw/busy", "sw/quiet"]);

		const busy = rows[0];
		if (!busy) {
			throw new Error("expected sw/busy");
		}
		expect(busy.armed).toBe(false);
		expect(busy.pendingModeration).toBe(1);
		expect(busy.blocked24h).toBe(1);
		expect(busy.lastActivityAt).not.toBeNull();

		const quiet = rows[1];
		if (!quiet) {
			throw new Error("expected sw/quiet");
		}
		expect(quiet.pendingModeration).toBe(0);
		expect(quiet.blocked24h).toBe(0);
		expect(quiet.lastActivityAt).toBeNull();
	});

	test("another user's installation repos never leak in", async () => {
		await seedUser("u-sw-2");
		const rows = await listSwitcherRepos(db, "u-sw-2");
		expect(rows).toHaveLength(0);
	});
});

describe("claimInstallationForForgeUser — the durable webhook link path", () => {
	async function seedIdentity(
		userId: string,
		externalId: string,
	): Promise<void> {
		await db
			.insert(forgeIdentities)
			.values({
				id: `fi-${userId}`,
				userId,
				forge: "github",
				externalId,
				username: userId,
			})
			.onConflictDoNothing();
	}

	test("links the installer (matched by forge id) → repos granted", async () => {
		await seedUser("u-installer");
		await seedIdentity("u-installer", "gh-9001");
		await seedRepo("inst-webhook", "r-w", "acme/webhook");

		const result = await claimInstallationForForgeUser(db, {
			installerExternalId: "gh-9001",
			installationId: "inst-webhook",
		});
		expect(result).toEqual({ claimed: true, userId: "u-installer" });

		const state = await getOnboardingState(db, "u-installer");
		expect(state.hasInstallation).toBe(true);
		expect(state.repos.map((r) => r.fullName)).toEqual(["acme/webhook"]);
	});

	test("installer with no forge identity yet ⇒ no-op, deferred to setup callback", async () => {
		await seedRepo("inst-orphan", "r-o", "acme/orphan");
		const result = await claimInstallationForForgeUser(db, {
			installerExternalId: "gh-unknown",
			installationId: "inst-orphan",
		});
		expect(result).toEqual({ claimed: false, userId: null });
	});
});
