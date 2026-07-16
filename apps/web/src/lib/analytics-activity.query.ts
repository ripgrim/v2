import { queryOptions } from "@tanstack/react-query";
import { getAnalyticsActivity } from "#/lib/analytics-activity.functions";

export const analyticsActivityQueryKeys = {
	all: ["analytics-activity"] as const,
	metric: (org: string, repo: string, metric: string) =>
		[...analyticsActivityQueryKeys.all, org, repo, metric] as const,
};

export const analyticsActivityQueryOptions = (
	org: string,
	repo: string,
	metric: string,
) =>
	queryOptions({
		queryKey: analyticsActivityQueryKeys.metric(org, repo, metric),
		queryFn: ({ signal }) =>
			getAnalyticsActivity({ data: { org, repo, metric }, signal }),
		staleTime: 10_000,
	});
