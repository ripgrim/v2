import { createFileRoute } from "@tanstack/react-router";
import {
	AnalyticsPage,
	AnalyticsPageSkeleton,
} from "#/components/analytics/analytics-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$org/$repo/analytics")({
	component: AnalyticsPage,
	pendingComponent: AnalyticsPageSkeleton,
	head: ({ params, match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle(`${params.repo} · analytics`),
			description: "repo stats and metrics.",
			noindex: true,
		}),
});
