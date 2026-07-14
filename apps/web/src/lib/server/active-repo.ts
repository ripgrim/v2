import type { RepoLite } from "@tripwire/db";
import { requireSession } from "#/lib/server/session";

/**
 * The active repo the dashboard is scoped to (§10 onboarding). With auth on,
 * it's the signed-in user's `active_repo_id`. In open-dev (no auth) there is no
 * user to own an installation, so we fall back to the first installed repo —
 * local development stays usable without the full GitHub round-trip.
 *
 * Returns null when there's genuinely nothing to scope to (onboarded user with
 * no active repo, or an empty dev DB); callers return honest-empty rather than
 * inventing data.
 */
export async function getActiveRepo(): Promise<RepoLite | null> {
	const userId = await requireSession();
	const { onboardingServices, repoServices } = await import("@tripwire/db");
	const { getDb } = await import("#/lib/server/db");
	const { db } = getDb();
	if (userId) {
		return await onboardingServices.getActiveRepo(db, userId);
	}
	// open-dev: no session, no per-user active repo — use the first installed repo.
	const repos = await repoServices.listActiveRepos(db);
	const first = repos[0];
	return first
		? {
				id: first.id,
				owner: first.owner,
				name: first.name,
				fullName: first.fullName,
				private: first.private,
				armed: first.armed,
				backfillTotal: first.backfillTotal,
				backfillDone: first.backfillDone,
			}
		: null;
}
