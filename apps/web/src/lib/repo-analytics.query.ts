import { queryOptions } from "@tanstack/react-query";
import { getRepoAnalytics } from "#/lib/repo-analytics.functions";

export const repoAnalyticsQueryKeys = {
	all: ["repo-analytics"] as const,
	repo: (org: string, repo: string) =>
		[...repoAnalyticsQueryKeys.all, org, repo] as const,
};

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

/**
 * Scoped by org/repo from the URL — the key carries the scope even though the
 * mock returns the active repo's data, so a deep link refetches per repo.
 */
export const repoAnalyticsQueryOptions = (org: string, repo: string) =>
	queryOptions({
		queryKey: repoAnalyticsQueryKeys.repo(org, repo),
		queryFn: () => getRepoAnalytics(),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
