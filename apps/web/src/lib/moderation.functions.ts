import { createServerFn } from "@tanstack/react-start";
import type { ModStats } from "#/lib/moderation.types";

// The home stat cards are REAL — rollup-backed via insights (§13.10). A DB
// error surfaces honestly (the caller renders an error state); there is NO
// mock fallback — fabricated numbers are worse than a visible failure.
export const getModerationStats = createServerFn({ method: "GET" }).handler(
	async (): Promise<ModStats> => {
		const { requireSession } = await import("#/lib/server/session");
		await requireSession();
		const { insightServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		return await insightServices.getHomeStats(getDb().db);
	},
);
