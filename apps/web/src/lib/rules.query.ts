import { queryOptions } from "@tanstack/react-query";
import {
	getRulesHeaderStats,
	listRuleConfigViews,
} from "#/lib/rules.functions";

export const rulesQueryKeys = {
	all: ["rules"] as const,
	configs: () => [...rulesQueryKeys.all, "configs"] as const,
	config: (org: string, repoId: string) =>
		[...rulesQueryKeys.configs(), org, repoId] as const,
	stats: () => [...rulesQueryKeys.all, "stats"] as const,
	stat: (org: string, repoId: string) =>
		[...rulesQueryKeys.stats(), org, repoId] as const,
};

export const ruleConfigsQueryOptions = (org: string, repoId: string) =>
	queryOptions({
		queryKey: rulesQueryKeys.config(org, repoId),
		queryFn: ({ signal }) =>
			listRuleConfigViews({ data: { org, repoId }, signal }),
		staleTime: 15_000,
		enabled: repoId !== "",
	});

export const rulesStatsQueryOptions = (org: string, repoId: string) =>
	queryOptions({
		queryKey: rulesQueryKeys.stat(org, repoId),
		queryFn: ({ signal }) =>
			getRulesHeaderStats({ data: { org, repoId }, signal }),
		staleTime: 15_000,
		enabled: repoId !== "",
	});
