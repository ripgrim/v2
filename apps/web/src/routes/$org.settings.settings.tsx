import { createFileRoute } from "@tanstack/react-router";
import {
	OrgGeneralSettingsPage,
	OrgGeneralSettingsPageSkeleton,
} from "#/components/organizations/org-general-settings-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$org/settings/settings")({
	component: OrgGeneralSettingsPage,
	pendingComponent: OrgGeneralSettingsPageSkeleton,
	head: ({ params, match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle(`${params.org} · settings`),
			description: "org name, slug, avatar, and deletion.",
			noindex: true,
		}),
});
