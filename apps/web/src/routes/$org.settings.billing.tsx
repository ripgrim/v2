import { createFileRoute } from "@tanstack/react-router";
import {
	OrgBillingPage,
	OrgBillingPageSkeleton,
} from "#/components/organizations/org-billing-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$org/settings/billing")({
	component: OrgBillingPage,
	pendingComponent: OrgBillingPageSkeleton,
	head: ({ params, match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle(`${params.org} · billing`),
			description: "billing (coming soon).",
			noindex: true,
		}),
});
