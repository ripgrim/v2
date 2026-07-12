import { createServerFn } from "@tanstack/react-start";
import type { OnboardingState, RepoLite } from "@tripwire/db";

export type { OnboardingState, RepoLite };

/** The active repo the dashboard is scoped to — null until onboarded. */
export const getActiveRepoInfo = createServerFn({ method: "GET" }).handler(
	async (): Promise<RepoLite | null> => {
		const { getActiveRepo } = await import("#/lib/server/active-repo");
		return await getActiveRepo();
	},
);

/**
 * The GitHub App install URL for THIS user, carrying a CSRF-safe state. Null in
 * open-dev (no session to bind) or when the app slug isn't configured — the
 * onboarding page shows that honestly instead of a dead link.
 */
export const getInstallUrl = createServerFn({ method: "GET" }).handler(
	async (): Promise<string | null> => {
		const { requireSession } = await import("#/lib/server/session");
		const userId = await requireSession();
		const slug = process.env.GITHUB_APP_SLUG;
		if (!userId || !slug) {
			return null;
		}
		const { signInstallState } = await import("#/lib/server/install-state");
		const state = signInstallState(userId);
		return `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`;
	},
);

/** Where /onboarding stands for the signed-in user. */
export const getOnboardingState = createServerFn({ method: "GET" }).handler(
	async (): Promise<OnboardingState> => {
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
			})),
			activeRepo: null,
		};
	},
);

/** Pick the active repo (the narrowing step). Rejects a repo that isn't yours. */
export const chooseActiveRepo = createServerFn({ method: "POST" })
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
 * Setup URL callback: link the installation to the SIGNED-IN user. The state
 * must HMAC-bind that same user (CSRF). Returns whether it linked so the caller
 * can route to the narrowing step.
 */
export const completeInstallation = createServerFn({ method: "POST" })
	.inputValidator((input: { installationId: string; state?: string }) => input)
	.handler(async ({ data }): Promise<{ linked: boolean }> => {
		const { requireSession } = await import("#/lib/server/session");
		const userId = await requireSession();
		if (!userId) {
			return { linked: false };
		}
		const { verifyInstallState } = await import("#/lib/server/install-state");
		const boundUser = verifyInstallState(data.state);
		if (boundUser !== userId) {
			// A missing/forged state or a mismatched user — refuse to link.
			return { linked: false };
		}
		const { onboardingServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const { claimed } = await onboardingServices.linkUserInstallation(
			getDb().db,
			{ userId, installationId: data.installationId },
		);
		return { linked: claimed };
	});
