import { createFileRoute } from "@tanstack/react-router";
import {
	ActivityPage,
	ActivityPageSkeleton,
} from "#/components/activity/activity-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/activity")({
	component: ActivityPage,
	pendingComponent: ActivityPageSkeleton,
	head: ({ match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle("Activity"),
			description: "Live feed of forge events and the verdicts they trigger.",
			noindex: true,
		}),
});
