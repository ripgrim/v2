import { queryOptions } from "@tanstack/react-query";
import { getGithubIntegration } from "#/lib/integrations.functions";

export const integrationsQueryKeys = {
	all: ["integrations"] as const,
	github: () => [...integrationsQueryKeys.all, "github"] as const,
};

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

export const githubIntegrationQueryOptions = () =>
	queryOptions({
		queryKey: integrationsQueryKeys.github(),
		queryFn: ({ signal }) => getGithubIntegration({ signal }),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
