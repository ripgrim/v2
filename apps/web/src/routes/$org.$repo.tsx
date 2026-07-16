import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { OrgNotFound } from "#/components/organizations/org-not-found";
import { getOrgRepoContext } from "#/lib/org.functions";
import { orgQueryKeys } from "#/lib/org.query";

/** /:org/:repo — resolve the repo segment within the org, 404 otherwise. */
export const Route = createFileRoute("/$org/$repo")({
	beforeLoad: async ({ params, context }) => {
		try {
			const repo = await getOrgRepoContext({
				data: { org: params.org, repo: params.repo },
			});
			context.queryClient.setQueryData(
				orgQueryKeys.repo(params.org, params.repo),
				repo,
			);
			return { repo };
		} catch {
			throw notFound();
		}
	},
	notFoundComponent: OrgNotFound,
	component: () => <Outlet />,
});
