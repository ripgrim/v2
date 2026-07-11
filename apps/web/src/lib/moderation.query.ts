import { queryOptions } from "@tanstack/react-query";
import {
	getModerationQueue,
	getModerationStats,
} from "#/lib/moderation.functions";

export const moderationQueryKeys = {
	all: ["moderation"] as const,
	queue: () => [...moderationQueryKeys.all, "queue"] as const,
	stats: () => [...moderationQueryKeys.all, "stats"] as const,
};

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

export const moderationQueueQueryOptions = () =>
	queryOptions({
		queryKey: moderationQueryKeys.queue(),
		queryFn: ({ signal }) => getModerationQueue({ signal }),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});

export const moderationStatsQueryOptions = () =>
	queryOptions({
		queryKey: moderationQueryKeys.stats(),
		queryFn: ({ signal }) => getModerationStats({ signal }),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
