import { queryOptions } from "@tanstack/react-query";
import { getLatestRunId, getRun } from "#/lib/runs.functions";

export const runsQueryKeys = {
	all: ["runs"] as const,
	details: () => [...runsQueryKeys.all, "detail"] as const,
	detail: (runId: string) => [...runsQueryKeys.details(), runId] as const,
	latestForActive: () => [...runsQueryKeys.all, "latest-active"] as const,
};

/** §4 — the active repo's most recent run, for the palette's "latest run" jump. */
export const latestRunQueryOptions = () =>
	queryOptions({
		queryKey: runsQueryKeys.latestForActive(),
		queryFn: ({ signal }) => getLatestRunId({ signal }),
		staleTime: 15_000,
	});

export const runQueryOptions = (runId: string) =>
	queryOptions({
		queryKey: runsQueryKeys.detail(runId),
		queryFn: ({ signal }) => getRun({ data: { runId }, signal }),
		staleTime: 10_000,
	});
