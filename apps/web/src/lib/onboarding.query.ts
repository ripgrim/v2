import { queryOptions } from "@tanstack/react-query";
import { getOrgInstallUrl } from "#/lib/onboarding.functions";

/**
 * Install-flow query keys (§9). Org-scoped like #/lib/org.query — the slug
 * from the URL is IN the key, so switching orgs is a cache key change.
 */
export const onboardingQueryKeys = {
	all: ["onboarding"] as const,
	installUrl: (org: string) =>
		[...onboardingQueryKeys.all, "install-url", org] as const,
};

/** ADMIN-only server fn — gate with `enabled` on the caller's role. */
export const orgInstallUrlQueryOptions = (org: string) =>
	queryOptions({
		queryKey: onboardingQueryKeys.installUrl(org),
		queryFn: ({ signal }) => getOrgInstallUrl({ data: { org }, signal }),
		staleTime: 5 * 60_000,
	});
