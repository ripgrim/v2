import { createFileRoute } from "@tanstack/react-router";
import {
	WorkflowsPage,
	WorkflowsPageSkeleton,
} from "#/components/workflows/workflows-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/workflows")({
	component: WorkflowsPage,
	pendingComponent: WorkflowsPageSkeleton,
	head: ({ match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle("Workflows"),
			description: "node-based rule workflows — the editor emits the DAG.",
			noindex: true,
		}),
});
