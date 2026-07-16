import { createFileRoute } from "@tanstack/react-router";
import {
	OrgMembersPage,
	OrgMembersPageSkeleton,
} from "#/components/organizations/org-members-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$org/settings/members")({
	component: OrgMembersPage,
	pendingComponent: OrgMembersPageSkeleton,
	head: ({ params, match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle(`${params.org} · members`),
			description: "org members, roles, and invite links.",
			noindex: true,
		}),
});
