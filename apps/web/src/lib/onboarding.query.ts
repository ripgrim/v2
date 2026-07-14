import { queryOptions } from "@tanstack/react-query";
import {
	getActiveRepoInfo,
	getInstallUrl,
	getOnboardingState,
	getSwitcherRepos,
} from "#/lib/onboarding.functions";

export const onboardingQueryKeys = {
	all: ["onboarding"] as const,
	state: () => [...onboardingQueryKeys.all, "state"] as const,
	activeRepo: () => [...onboardingQueryKeys.all, "active-repo"] as const,
	switcher: () => [...onboardingQueryKeys.all, "switcher"] as const,
	installUrl: () => [...onboardingQueryKeys.all, "install-url"] as const,
};

export const switcherReposQueryOptions = () =>
	queryOptions({
		queryKey: onboardingQueryKeys.switcher(),
		queryFn: ({ signal }) => getSwitcherRepos({ signal }),
		staleTime: 15_000,
	});

export const onboardingStateQueryOptions = () =>
	queryOptions({
		queryKey: onboardingQueryKeys.state(),
		queryFn: ({ signal }) => getOnboardingState({ signal }),
		staleTime: 10_000,
	});

export const activeRepoQueryOptions = () =>
	queryOptions({
		queryKey: onboardingQueryKeys.activeRepo(),
		queryFn: ({ signal }) => getActiveRepoInfo({ signal }),
		staleTime: 60_000,
	});

export const installUrlQueryOptions = () =>
	queryOptions({
		queryKey: onboardingQueryKeys.installUrl(),
		queryFn: ({ signal }) => getInstallUrl({ signal }),
		staleTime: 5 * 60_000,
	});
