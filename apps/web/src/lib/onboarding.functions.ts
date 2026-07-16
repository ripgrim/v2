import { createServerFn } from "@tanstack/react-start";
import type { OnboardingState, RepoLite, SwitcherRepo } from "@tripwire/db";
import { accessGuardMiddleware } from "#/lib/server/gated-server-fn";

export type { OnboardingState, RepoLite, SwitcherRepo };

/** §4 repo switcher — every repo the user can reach, with triage signal. */
export const getSwitcherRepos = createServerFn({ method: "GET" })
	.middleware([accessGuardMiddleware])
	.handler(async (): Promise<SwitcherRepo[]> => {
		const { requireSession } = await import("#/lib/server/session");
		const userId = await requireSession();
		const { onboardingServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		return await onboardingServices.listSwitcherRepos(getDb().db, userId);
	});

/** The active repo the dashboard is scoped to — null until onboarded. */
export const getActiveRepoInfo = createServerFn({ method: "GET" })
	.middleware([accessGuardMiddleware])
	.handler(async (): Promise<RepoLite | null> => {
		const { getActiveRepo } = await import("#/lib/server/active-repo");
		return await getActiveRepo();
	});

/**
 * The GitHub App install URL for THIS user, carrying a CSRF-safe state. The
 * REASON is split out so onboarding can tell distinct failures apart instead of
 * collapsing them into one misleading line (the old `string | null` made "slug
 * unset" and "no user" indistinguishable, and a thrown 401 read as "not
 * configured" too):
 *  - `ready`          → the signed install URL.
 *  - `not-configured` → GITHUB_APP_SLUG is unset (a deploy/env problem).
 *  - `no-session`     → open-dev has no user to bind the state to.
 * A missing session under real auth never returns here — requireSession throws
 * 401, which the UI renders as its own (retryable) query-error state.
 */
export type InstallUrlState =
	| { status: "ready"; url: string }
	| { status: "not-configured" }
	| { status: "no-session" };

export const getInstallUrl = createServerFn({ method: "GET" })
	.middleware([accessGuardMiddleware])
	.handler(async (): Promise<InstallUrlState> => {
		const { requireSession } = await import("#/lib/server/session");
		const userId = await requireSession();
		const slug = process.env.GITHUB_APP_SLUG;
		// Slug first: a missing slug is an env problem worth reporting even in
		// open-dev, and it's independent of who (if anyone) is signed in.
		if (!slug) {
			return { status: "not-configured" };
		}
		if (!userId) {
			return { status: "no-session" };
		}
		const { signInstallState } = await import("#/lib/server/install-state");
		const state = signInstallState(userId);
		return {
			status: "ready",
			url: `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`,
		};
	});

/** Where /onboarding stands for the signed-in user. */
export const getOnboardingState = createServerFn({ method: "GET" })
	.middleware([accessGuardMiddleware])
	.handler(async (): Promise<OnboardingState> => {
		const { requireSession } = await import("#/lib/server/session");
		const userId = await requireSession();
		const { onboardingServices, repoServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const { db } = getDb();
		if (userId) {
			return await onboardingServices.getOnboardingState(db, userId);
		}
		// open-dev: no per-user link — surface the installed repos so local dev
		// isn't wedged behind an onboarding gate it can never pass.
		const repos = await repoServices.listActiveRepos(db);
		return {
			hasInstallation: repos.length > 0,
			repos: repos.map((r) => ({
				id: r.id,
				owner: r.owner,
				name: r.name,
				fullName: r.fullName,
				private: r.private,
				armed: r.armed,
				backfillTotal: r.backfillTotal,
				backfillDone: r.backfillDone,
			})),
			activeRepo: null,
		};
	});

/** Pick the active repo (the narrowing step). Rejects a repo that isn't yours. */
export const chooseActiveRepo = createServerFn({ method: "POST" })
	.middleware([accessGuardMiddleware])
	.inputValidator((input: { repoId: string }) => input)
	.handler(async ({ data }): Promise<{ ok: boolean }> => {
		const { requireSession } = await import("#/lib/server/session");
		const userId = await requireSession();
		if (!userId) {
			return { ok: false };
		}
		const { onboardingServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const ok = await onboardingServices.setActiveRepo(
			getDb().db,
			userId,
			data.repoId,
		);
		return { ok };
	});

/**
 * Setup URL callback: link the installation to the SIGNED-IN user (the real
 * WHO). A PRESENT state must HMAC-bind that same user (CSRF); a direct install
 * from GitHub's own UI carries NO state, so we link it to the session anyway —
 * the state is hardening, not a gate on the happy path. Residual risk (tricking
 * a logged-in victim into claiming a fresh installation) is ledgered in
 * DECISIONS; the `(forge, installationId)` UNIQUE still blocks stealing a
 * claimed one.
 */
export const completeInstallation = createServerFn({ method: "POST" })
	.middleware([accessGuardMiddleware])
	.inputValidator((input: { installationId: string; state?: string }) => input)
	.handler(async ({ data }): Promise<{ linked: boolean }> => {
		const { requireSession } = await import("#/lib/server/session");
		const userId = await requireSession();
		if (!userId) {
			return { linked: false };
		}
		if (data.state) {
			const { verifyInstallState } = await import("#/lib/server/install-state");
			if (verifyInstallState(data.state) !== userId) {
				// A state was supplied but doesn't bind this user — forged; refuse.
				return { linked: false };
			}
		}
		const { onboardingServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const { claimed } = await onboardingServices.linkUserInstallation(
			getDb().db,
			{ userId, installationId: data.installationId },
		);
		return { linked: claimed };
	});
