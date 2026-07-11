import { createServerFn } from "@tanstack/react-start";
import { seedFlaggedItems, seedStats } from "#/lib/mock-data";
import type { FlaggedItem, ModStats } from "#/lib/moderation.types";

// The queue list is still mock-backed (its rich shape outlives real data so
// far); the stat cards are REAL — rollup-backed via insights (§13.10), with a
// mock fallback when the db is unreachable in demo-only mode.
export const getModerationQueue = createServerFn({ method: "GET" }).handler(
	async (): Promise<FlaggedItem[]> => {
		await new Promise((resolve) => setTimeout(resolve, 200));
		return seedFlaggedItems(Date.now());
	},
);

export const getModerationStats = createServerFn({ method: "GET" }).handler(
	async (): Promise<ModStats> => {
		try {
			const { insightServices } = await import("@tripwire/db");
			const { getDb } = await import("#/lib/server/db");
			return await insightServices.getHomeStats(getDb().db);
		} catch {
			return seedStats();
		}
	},
);
