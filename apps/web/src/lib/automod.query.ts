import { queryOptions } from "@tanstack/react-query";
import { getAutomodRules, getAutomodStats } from "#/lib/automod.functions";

export const automodQueryKeys = {
	all: ["automod"] as const,
	rules: () => [...automodQueryKeys.all, "rules"] as const,
	stats: () => [...automodQueryKeys.all, "stats"] as const,
};

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

export const automodRulesQueryOptions = () =>
	queryOptions({
		queryKey: automodQueryKeys.rules(),
		queryFn: ({ signal }) => getAutomodRules({ signal }),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});

export const automodStatsQueryOptions = () =>
	queryOptions({
		queryKey: automodQueryKeys.stats(),
		queryFn: ({ signal }) => getAutomodStats({ signal }),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
