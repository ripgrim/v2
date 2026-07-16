import { createFileRoute } from "@tanstack/react-router";
import { RulesPage, RulesPageSkeleton } from "#/components/rules/rules-page";
import { buildSeo, formatPageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$org/$repo/rules")({
	component: RulesPage,
	pendingComponent: RulesPageSkeleton,
	head: ({ params, match }) =>
		buildSeo({
			path: match.pathname,
			title: formatPageTitle(`${params.repo} · rules`),
			description: "rule configuration.",
			noindex: true,
		}),
});
