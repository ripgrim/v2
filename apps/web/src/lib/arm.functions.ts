import { createServerFn } from "@tanstack/react-start";

/**
 * §4 arming — turn the gate ON for the active repo. Arming is always an explicit
 * act (this is the ONLY UI path to it); picking a repo scopes the dashboard, it
 * does not arm. Session-gated; open-dev arms the first installed repo, matching
 * `getActiveRepo`. Unit 3 enqueues arm-time backfill from here.
 */
export const armActiveRepo = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ armed: boolean; repoId: string | null }> => {
		const { getActiveRepo } = await import("#/lib/server/active-repo");
		const active = await getActiveRepo();
		if (!active) {
			return { armed: false, repoId: null };
		}
		const { repoServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		await repoServices.setRepoArmed(getDb().db, active.id, true);
		return { armed: true, repoId: active.id };
	},
);
