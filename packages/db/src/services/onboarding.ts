import { generateId } from "@tripwire/utils";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../client.ts";
import { forgeIdentities, user, userInstallations } from "../schema/auth.ts";
import { repos } from "../schema/repos.ts";

/**
 * §4 repo switcher row — a name plus SIGNAL, so the switcher is triage, not
 * navigation. Sorted by recent activity (the repo you want is the one that just
 * had something happen), grouped by owner in the UI.
 */
export interface SwitcherRepo {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	armed: boolean;
	pendingModeration: number;
	blocked24h: number;
	lastActivityAt: string | null;
}

/**
 * Every repo the user's installations grant, each carrying its switcher signal.
 * `null` userId (open-dev, no session) lists every installed repo.
 */
export async function listSwitcherRepos(
	db: Db,
	userId: string | null,
): Promise<SwitcherRepo[]> {
	const scope = userId
		? sql`JOIN user_installations ui ON ui.installation_id = r.installation_id AND ui.forge = r.forge AND ui.user_id = ${userId}`
		: sql``;
	const result = await db.execute(sql`
		SELECT r.id, r.owner, r.name, r.full_name AS "fullName", r.armed,
		       COALESCE(pend.n, 0)::int AS "pendingModeration",
		       COALESCE(blk.n, 0)::int AS "blocked24h",
		       act.last AS "lastActivityAt"
		FROM repos r
		${scope}
		LEFT JOIN (
		  SELECT run.repo_full_name AS repo, count(*) AS n
		  FROM moderation_items mi JOIN runs run ON run.id = mi.run_id
		  WHERE mi.status = 'pending' GROUP BY run.repo_full_name
		) pend ON pend.repo = r.full_name
		LEFT JOIN (
		  SELECT repo_full_name AS repo, count(*) AS n FROM runs
		  WHERE verdict = 'block' AND created_at > now() - make_interval(hours => 24)
		  GROUP BY repo_full_name
		) blk ON blk.repo = r.full_name
		LEFT JOIN (
		  SELECT repo_full_name AS repo, max(received_at) AS last
		  FROM events GROUP BY repo_full_name
		) act ON act.repo = r.full_name
		WHERE r.removed_at IS NULL
		ORDER BY act.last DESC NULLS LAST, r.full_name
	`);
	return (result.rows as Record<string, unknown>[]).map((row) => ({
		id: String(row.id),
		owner: String(row.owner),
		name: String(row.name),
		fullName: String(row.fullName),
		armed: Boolean(row.armed),
		pendingModeration: Number(row.pendingModeration ?? 0),
		blocked24h: Number(row.blocked24h ?? 0),
		lastActivityAt: row.lastActivityAt
			? new Date(row.lastActivityAt as string).toISOString()
			: null,
	}));
}

/**
 * Onboarding (§10): tie the signed-in user to their App installation and their
 * ONE active repo. Repos are reached through the installation
 * (`repos.installation_id = user_installations.installation_id`); all granted
 * repos stay synced, only the active one scopes the dashboard.
 */

export interface RepoLite {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	private: boolean;
	/** §4 — false ⇒ scoped for viewing but not gating; drives the arm CTA. */
	armed: boolean;
	/** §4 arm-time backfill progress; non-null total ⇒ a replay is in flight. */
	backfillTotal: number | null;
	backfillDone: number | null;
}

const REPO_LITE = {
	id: repos.id,
	owner: repos.owner,
	name: repos.name,
	fullName: repos.fullName,
	private: repos.private,
	armed: repos.armed,
	backfillTotal: repos.backfillTotal,
	backfillDone: repos.backfillDone,
} as const;

/**
 * Claim an installation for a user (Setup URL callback, from the signed-in
 * session). Idempotent; the `(forge, installationId)` unique means a second
 * user cannot steal an already-claimed installation — the insert is a no-op and
 * `claimed` reports whether THIS user now owns it.
 */
export async function linkUserInstallation(
	db: Db,
	input: { userId: string; installationId: string; forge?: string },
): Promise<{ claimed: boolean }> {
	const forge = input.forge ?? "github";
	await db
		.insert(userInstallations)
		.values({
			id: generateId(),
			userId: input.userId,
			forge,
			installationId: input.installationId,
		})
		.onConflictDoNothing({
			target: [userInstallations.forge, userInstallations.installationId],
		});
	const owner = await db
		.select({ userId: userInstallations.userId })
		.from(userInstallations)
		.where(
			and(
				eq(userInstallations.forge, forge),
				eq(userInstallations.installationId, input.installationId),
			),
		);
	return { claimed: owner[0]?.userId === input.userId };
}

/**
 * Claim an installation for the user who INSTALLED it, matched by their forge
 * identity from the `installation` webhook's actor. This is the DURABLE link
 * path: it does not depend on the browser carrying `installation_id` through
 * GitHub's post-install redirect (the Setup URL callback is the fallback). A
 * no-op when the installer has no `forge_identities` row yet (they installed
 * before signing in) — onboarding's callback still links them later. Idempotent
 * via `linkUserInstallation`'s `(forge, installationId)` unique.
 */
export async function claimInstallationForForgeUser(
	db: Db,
	input: {
		forge?: string;
		installerExternalId: string;
		installationId: string;
	},
): Promise<{ claimed: boolean; userId: string | null }> {
	const forge = input.forge ?? "github";
	const identities = await db
		.select({ userId: forgeIdentities.userId })
		.from(forgeIdentities)
		.where(
			and(
				eq(forgeIdentities.forge, forge),
				eq(forgeIdentities.externalId, input.installerExternalId),
			),
		)
		.limit(1);
	const userId = identities[0]?.userId ?? null;
	if (!userId) {
		return { claimed: false, userId: null };
	}
	const { claimed } = await linkUserInstallation(db, {
		userId,
		installationId: input.installationId,
		forge,
	});
	return { claimed, userId };
}

/** Every non-removed repo the user's installations grant. */
export async function listUserRepos(
	db: Db,
	userId: string,
): Promise<RepoLite[]> {
	return await db
		.select(REPO_LITE)
		.from(repos)
		.innerJoin(
			userInstallations,
			and(
				eq(userInstallations.installationId, repos.installationId),
				eq(userInstallations.forge, repos.forge),
			),
		)
		.where(and(eq(userInstallations.userId, userId), isNull(repos.removedAt)));
}

/** The user's active repo, or null (also null if it was later uninstalled). */
export async function getActiveRepo(
	db: Db,
	userId: string,
): Promise<RepoLite | null> {
	const rows = await db
		.select(REPO_LITE)
		.from(user)
		.innerJoin(repos, eq(repos.id, user.activeRepoId))
		.where(and(eq(user.id, userId), isNull(repos.removedAt)));
	return rows[0] ?? null;
}

/**
 * Set the active repo — only a repo the user actually has access to (guards
 * against setting someone else's repo). Returns false when the repo isn't
 * theirs.
 */
export async function setActiveRepo(
	db: Db,
	userId: string,
	repoId: string,
): Promise<boolean> {
	const granted = await listUserRepos(db, userId);
	if (!granted.some((r) => r.id === repoId)) {
		return false;
	}
	await db
		.update(user)
		.set({ activeRepoId: repoId })
		.where(eq(user.id, userId));
	return true;
}

export interface OnboardingState {
	hasInstallation: boolean;
	repos: RepoLite[];
	activeRepo: RepoLite | null;
}

/** Everything /onboarding + the redirect gate need in one round-trip. */
export async function getOnboardingState(
	db: Db,
	userId: string,
): Promise<OnboardingState> {
	const installs = await db
		.select({ id: userInstallations.id })
		.from(userInstallations)
		.where(eq(userInstallations.userId, userId))
		.limit(1);
	const [granted, activeRepo] = await Promise.all([
		listUserRepos(db, userId),
		getActiveRepo(db, userId),
	]);
	return {
		hasInstallation: installs.length > 0,
		repos: granted,
		activeRepo,
	};
}
