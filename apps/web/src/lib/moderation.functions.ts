import { createServerFn } from "@tanstack/react-start";
import { seedFlaggedItems, seedStats } from "#/lib/mock-data";
import type { FlaggedItem, ModStats } from "#/lib/moderation.types";

// Mock-backed server functions. In a real deployment these would hit the
// moderation store / GitHub API behind auth — the call sites don't care which.
export const getModerationQueue = createServerFn({ method: "GET" }).handler(
	async (): Promise<FlaggedItem[]> => {
		// Small latency so the loading skeletons are observable in dev.
		await new Promise((resolve) => setTimeout(resolve, 200));
		return seedFlaggedItems(Date.now());
	},
);

export const getModerationStats = createServerFn({ method: "GET" }).handler(
	async (): Promise<ModStats> => {
		return seedStats();
	},
);
