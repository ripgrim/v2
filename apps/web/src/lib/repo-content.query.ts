import { queryOptions } from "@tanstack/react-query";
import { getRepoContent } from "#/lib/repo-content.functions";

export const repoContentQueryKeys = {
	all: ["repo-content"] as const,
	scope: (org: string, repo?: string) =>
		[...repoContentQueryKeys.all, org, repo ?? "*"] as const,
};

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

/**
 * Scoped by org (and repo when known) from the URL. The repos list omits
 * `repo`; issue/pull lists and details pass it so deep links refetch per repo.
 */
export const repoContentQueryOptions = (org: string, repo?: string) =>
	queryOptions({
		queryKey: repoContentQueryKeys.scope(org, repo),
		queryFn: ({ signal }) => getRepoContent({ signal }),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
