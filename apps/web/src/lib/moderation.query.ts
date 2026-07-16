import { queryOptions } from "@tanstack/react-query";
import { getModerationStats } from "#/lib/moderation.functions";

export const moderationQueryKeys = {
	all: ["moderation"] as const,
	stats: (org: string, repo: string) =>
		[...moderationQueryKeys.all, org, repo, "stats"] as const,
};

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

export const moderationStatsQueryOptions = (org: string, repo: string) =>
	queryOptions({
		queryKey: moderationQueryKeys.stats(org, repo),
		queryFn: ({ signal }) =>
			getModerationStats({ data: { org, repo }, signal }),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
