import { createServerFn } from "@tanstack/react-start";

/**
 * §4 arming — turn the gate ON for the active repo. Arming is always an explicit
 * act (this is the ONLY UI path to it); picking a repo scopes the dashboard, it
 * does not arm. Session-gated; open-dev arms the first installed repo, matching
 * `getActiveRepo`. Enqueues arm-time backfill so the dashboard has history the
 * moment they arm — dev:demo has no worker/queue, so arming alone is enough there.
 */
export const armActiveRepo = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ armed: boolean; repoId: string | null }> => {
		const { getActiveRepo } = await import("#/lib/server/active-repo");
		const active = await getActiveRepo();
		if (!active) {
			return { armed: false, repoId: null };
		}
		const { BACKFILL_REPO_QUEUE, repoServices } = await import("@tripwire/db");
		const { getBoss, getDb, isDemoMode } = await import("#/lib/server/db");
		await repoServices.setRepoArmed(getDb().db, active.id, true);
		if (!isDemoMode()) {
			const boss = await getBoss();
			await boss.send(BACKFILL_REPO_QUEUE, { repoId: active.id });
		}
		return { armed: true, repoId: active.id };
	},
);
