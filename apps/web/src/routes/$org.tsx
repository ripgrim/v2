import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { OrgNotFound } from "#/components/organizations/org-not-found";
import { getOrgContext } from "#/lib/org.functions";
import { orgQueryKeys } from "#/lib/org.query";

/**
 * §8 — the URL is the source of truth for org scope. This layout resolves
 * the slug to an org + the caller's role BEFORE render; a non-member (or a
 * missing org) is a 404, never a 403 — org existence is not disclosed.
 */
export const Route = createFileRoute("/$org")({
	beforeLoad: async ({ params, context }) => {
		try {
			const org = await getOrgContext({ data: { org: params.org } });
			context.queryClient.setQueryData(orgQueryKeys.detail(params.org), org);
			return { org };
		} catch {
			throw notFound();
		}
	},
	notFoundComponent: OrgNotFound,
	// Pages own their DashboardLayout wrap (repo convention) — the layout
	// route only resolves scope.
	component: () => <Outlet />,
});
