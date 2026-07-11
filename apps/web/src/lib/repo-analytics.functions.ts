import { createServerFn } from "@tanstack/react-start";
import type { RepoAnalytics } from "#/lib/repo-analytics.types";
import { seedRepoAnalytics } from "#/lib/repo-analytics-mock-data";

export const getRepoAnalytics = createServerFn({ method: "GET" }).handler(
	async (): Promise<RepoAnalytics> => {
		await new Promise((resolve) => setTimeout(resolve, 200));
		return seedRepoAnalytics();
	},
);
