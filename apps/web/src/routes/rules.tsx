import { createFileRoute } from "@tanstack/react-router";
import { RulesPage, RulesPageSkeleton } from "#/components/rules/rules-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/rules")({
	component: RulesPage,
	pendingComponent: RulesPageSkeleton,
	head: ({ match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle("Rules"),
			description: "per-repo rule configuration.",
			noindex: true,
		}),
});
