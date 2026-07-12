import { createServerFn } from "@tanstack/react-start";
import type { ModStats } from "#/lib/moderation.types";

const ZERO_SERIES = () => Array.from({ length: 24 }, () => 0);
const ZERO_STAT = () => ({ value: 0, delta: 0, series: ZERO_SERIES() });
/** A freshly-installed repo with no runs yet — honest zeros, not a spinner. */
const ZERO_STATS = (): ModStats => ({
	pendingReports: ZERO_STAT(),
	resolvedToday: ZERO_STAT(),
	automodHits24h: ZERO_STAT(),
	bannedUsers: ZERO_STAT(),
});

// The home stat cards are REAL — rollup-backed via insights (§13.10), scoped to
// the active repo (§10). A DB error surfaces honestly (the caller renders an
// error state); there is NO mock fallback — fabricated numbers are worse than a
// visible failure.
export const getModerationStats = createServerFn({ method: "GET" }).handler(
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
