import { createFileRoute } from "@tanstack/react-router";
import {
	LiveModerationQueue,
	LiveModerationQueueSkeleton,
} from "#/components/moderation/live-queue";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/moderation")({
	component: LiveModerationQueue,
	pendingComponent: LiveModerationQueueSkeleton,
	head: ({ match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle("Moderation"),
			description: "paused runs awaiting a decision.",
			noindex: true,
		}),
});
