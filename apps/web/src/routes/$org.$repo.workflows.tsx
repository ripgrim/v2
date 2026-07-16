import { createFileRoute } from "@tanstack/react-router";
import {
	WorkflowsPage,
	WorkflowsPageSkeleton,
} from "#/components/workflows/workflows-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$org/$repo/workflows")({
	component: WorkflowsPage,
	pendingComponent: WorkflowsPageSkeleton,
	head: ({ params, match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle(`${params.repo} · workflows`),
			description: "the workflow editor.",
			noindex: true,
		}),
});
