import { queryOptions } from "@tanstack/react-query";
import { getContributorProfile } from "#/lib/contributor.functions";

export const contributorQueryKeys = {
	all: ["contributor"] as const,
	profile: (handle: string) => [...contributorQueryKeys.all, handle] as const,
};

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

export const contributorProfileQueryOptions = (handle: string) =>
	queryOptions({
		queryKey: contributorQueryKeys.profile(handle),
		queryFn: () => getContributorProfile(handle),
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});
