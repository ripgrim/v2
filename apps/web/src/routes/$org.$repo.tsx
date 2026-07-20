import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { OrgNotFound } from "#/components/organizations/org-not-found";
import { orgRepoQueryOptions } from "#/lib/org.query";

/** /:org/:repo — resolve the repo segment within the org, 404 otherwise. */
export const Route = createFileRoute("/$org/$repo")({
	beforeLoad: async ({ params, context }) => {
		try {
			const repo = await context.queryClient.ensureQueryData(
				orgRepoQueryOptions(params.org, params.repo),
			);
			return { repo };
		} catch {
			throw notFound();
		}
	},
	notFoundComponent: OrgNotFound,
	component: () => <Outlet />,
});
