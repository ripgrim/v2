import { queryOptions } from "@tanstack/react-query";
import { getRun } from "#/lib/runs.functions";

export const runsQueryKeys = {
	all: ["runs"] as const,
	details: () => [...runsQueryKeys.all, "detail"] as const,
	detail: (runId: string) => [...runsQueryKeys.details(), runId] as const,
};

export const runQueryOptions = (runId: string) =>
	queryOptions({
		queryKey: runsQueryKeys.detail(runId),
		queryFn: ({ signal }) => getRun({ data: { runId }, signal }),
		staleTime: 10_000,
	});
