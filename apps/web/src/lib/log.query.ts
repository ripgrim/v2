import { queryOptions } from "@tanstack/react-query";
import { getModerationLog } from "#/lib/log.functions";

export const logQueryKeys = {
	all: ["log"] as const,
	list: () => [...logQueryKeys.all, "list"] as const,
};

export const moderationLogQueryOptions = () =>
	queryOptions({
		queryKey: logQueryKeys.list(),
		queryFn: ({ signal }) => getModerationLog({ signal }),
		staleTime: 30_000,
		gcTime: 5 * 60_000,
	});
