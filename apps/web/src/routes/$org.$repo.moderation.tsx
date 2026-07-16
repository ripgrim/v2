import { createFileRoute } from "@tanstack/react-router";
import {
	ModerationPage,
	ModerationPageSkeleton,
} from "#/components/moderation/moderation-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$org/$repo/moderation")({
	component: ModerationPage,
	pendingComponent: ModerationPageSkeleton,
	head: ({ params, match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle(`${params.repo} · moderation`),
			description: "scoped triage queue.",
			noindex: true,
		}),
});
