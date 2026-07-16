import { createFileRoute } from "@tanstack/react-router";
import {
	ActivityPage,
	ActivityPageSkeleton,
} from "#/components/activity/activity-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$org/$repo/activity")({
	component: ActivityPage,
	pendingComponent: ActivityPageSkeleton,
	head: ({ params, match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle(`${params.repo} · activity`),
			description: "the repo's event feed.",
			noindex: true,
		}),
});
