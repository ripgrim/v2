import { createServerFn } from "@tanstack/react-start";
import type { AutomodRule, AutomodStats } from "#/lib/automod.types";
import { seedAutomodRules, seedAutomodStats } from "#/lib/automod-mock-data";

export const getAutomodRules = createServerFn({ method: "GET" }).handler(
	async (): Promise<AutomodRule[]> => {
		await new Promise((resolve) => setTimeout(resolve, 200));
		return seedAutomodRules(Date.now());
	},
);

export const getAutomodStats = createServerFn({ method: "GET" }).handler(
	async (): Promise<AutomodStats> => {
		return seedAutomodStats();
	},
);
