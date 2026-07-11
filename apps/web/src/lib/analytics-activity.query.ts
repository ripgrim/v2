import { queryOptions } from "@tanstack/react-query";
import { getAnalyticsActivity } from "#/lib/analytics-activity.functions";

export const analyticsActivityQueryKeys = {
	all: ["analytics-activity"] as const,
	metric: (metric: string) =>
		[...analyticsActivityQueryKeys.all, metric] as const,
};

export const analyticsActivityQueryOptions = (metric: string) =>
	queryOptions({
		queryKey: analyticsActivityQueryKeys.metric(metric),
		queryFn: ({ signal }) => getAnalyticsActivity({ data: { metric }, signal }),
		staleTime: 10_000,
	});
