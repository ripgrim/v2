import type { ModStats } from "#/lib/moderation.types";
import { gatedServerFn } from "#/lib/server/gated-server-fn";

const ZERO_SERIES = () => Array.from({ length: 24 }, () => 0);
const ZERO_STAT = () => ({ value: 0, delta: 0, series: ZERO_SERIES() });
/** A freshly-installed repo with no runs yet — honest zeros, not a spinner. */
const ZERO_STATS = (): ModStats => ({
	sentToReview: ZERO_STAT(),
	blocked: ZERO_STAT(),
	passed: ZERO_STAT(),
});

// The home stat cards are REAL — rollup-backed via insights (§13.10), scoped to
// the active repo (§10). A DB error surfaces honestly (the caller renders an
// error state); there is NO mock fallback — fabricated numbers are worse than a
// visible failure.
export const getModerationStats = gatedServerFn({ method: "GET" }).handler(
	async (): Promise<ModStats> => {
		const { getActiveRepo } = await import("#/lib/server/active-repo");
		const repo = await getActiveRepo();
		if (!repo) {
			return ZERO_STATS();
		}
		const { insightServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		return await insightServices.getHomeStats(getDb().db, repo.fullName);
	},
);
