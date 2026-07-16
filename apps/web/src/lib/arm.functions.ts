import { createServerFn } from "@tanstack/react-start";
import { accessGuardMiddleware } from "#/lib/server/gated-server-fn";

/**
 * §4 arming — turn the gate ON and enqueue arm-time backfill so the dashboard
 * has history immediately. Arming is always an explicit act (these are the only
 * UI paths to it). dev:demo has no worker/queue, so arming alone is enough there.
 * Runs server-side only (called from the handlers below).
 */
async function armById(repoId: string): Promise<void> {
	const { BACKFILL_REPO_QUEUE, repoServices } = await import("@tripwire/db");
	const { getBoss, getDb, isDemoMode } = await import("#/lib/server/db");
	await repoServices.setRepoArmed(getDb().db, repoId, true);
	if (!isDemoMode()) {
		const boss = await getBoss();
		await boss.send(BACKFILL_REPO_QUEUE, { repoId });
	}
}

/** Arm the ACTIVE repo (the home/scoped-page CTA). Open-dev arms the first repo. */
export const armActiveRepo = createServerFn({ method: "POST" })
	.middleware([accessGuardMiddleware])
	.handler(async (): Promise<{ armed: boolean; repoId: string | null }> => {
		const { getActiveRepo } = await import("#/lib/server/active-repo");
		const active = await getActiveRepo();
		if (!active) {
			return { armed: false, repoId: null };
		}
		await armById(active.id);
		return { armed: true, repoId: active.id };
	});

/**
 * Disarm the ACTIVE repo — turn the gate back OFF (the palette's disarm action).
 * Events keep ingesting; only the RUN is skipped, same as a never-armed repo. No
 * backfill on the way back on later — the stored events are still there to replay.
 */
export const disarmActiveRepo = createServerFn({ method: "POST" })
	.middleware([accessGuardMiddleware])
	.handler(async (): Promise<{ armed: boolean; repoId: string | null }> => {
		const { getActiveRepo } = await import("#/lib/server/active-repo");
		const active = await getActiveRepo();
		if (!active) {
			return { armed: false, repoId: null };
		}
		const { repoServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		await repoServices.setRepoArmed(getDb().db, active.id, false);
		return { armed: false, repoId: active.id };
	});

/** Arm a SPECIFIC repo (the switcher's inline arm) — only one the user can reach. */
export const armRepoById = createServerFn({ method: "POST" })
	.middleware([accessGuardMiddleware])
	.inputValidator((input: { repoId: string }) => input)
	.handler(
		async ({ data }): Promise<{ armed: boolean; repoId: string | null }> => {
			const { requireSession } = await import("#/lib/server/session");
			const userId = await requireSession();
			const { onboardingServices } = await import("@tripwire/db");
			const { getDb } = await import("#/lib/server/db");
			const allowed = await onboardingServices.listSwitcherRepos(
				getDb().db,
				userId,
			);
			if (!allowed.some((repo) => repo.id === data.repoId)) {
				return { armed: false, repoId: null };
			}
			await armById(data.repoId);
			return { armed: true, repoId: data.repoId };
		},
	);
