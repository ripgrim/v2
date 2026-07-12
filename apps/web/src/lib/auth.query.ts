import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser } from "#/lib/auth.functions";

export const authQueryKeys = {
	all: ["auth"] as const,
	currentUser: () => [...authQueryKeys.all, "current-user"] as const,
};

export const currentUserQueryOptions = () =>
	queryOptions({
		queryKey: authQueryKeys.currentUser(),
		queryFn: ({ signal }) => getCurrentUser({ signal }),
		staleTime: 5 * 60_000,
	});
