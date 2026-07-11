import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import {
	CRUMB_LINK,
	CrumbSep,
	CrumbText,
	RepoCrumbs,
} from "#/components/analytics/repo-crumbs";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { ThreadDetailShell } from "#/components/repo/thread-detail-shell";
import { ThreadView } from "#/components/repo/thread-view";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import { repoAnalyticsQueryOptions } from "#/lib/repo-analytics.query";
import { repoContentQueryOptions } from "#/lib/repo-content.query";
import { MODERATOR } from "#/lib/site-config";

export const Route = createFileRoute("/$org/$repo/issues/$id")({
	ssr: false,
	validateSearch: (search: Record<string, unknown>): { c?: string } => ({
		c: typeof search.c === "string" ? search.c : undefined,
	}),
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(
			repoContentQueryOptions(params.org, params.repo),
		);
		void context.queryClient.prefetchQuery(
			repoAnalyticsQueryOptions(params.org, params.repo),
		);
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
	},
	component: IssueDetailPage,
});

function IssueDetailPage() {
	const { org, repo, id } = Route.useParams();
	const { c: highlightId } = Route.useSearch();
	const content = useQuery(repoContentQueryOptions(org, repo));
	const analytics = useQuery(repoAnalyticsQueryOptions(org, repo));
	const queue = useQuery(moderationQueueQueryOptions());
	const rules = useQuery(automodRulesQueryOptions());

	const counts = {
		queue: queue.data?.length,
		automod: rules.data?.filter((rule) => rule.enabled).length,
	};

	const detail = content.data?.issueDetails[id];
	const threadAnalytics = analytics.data?.threads[`issues/${id}`];

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<ThreadDetailShell
				org={org}
				repo={repo}
				id={id}
				kind="issue"
				analytics={detail ? threadAnalytics : undefined}
			>
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
					<div className="flex items-center justify-between gap-4">
						<RepoCrumbs org={org} repo={repo}>
							<CrumbSep />
							<Link
								to="/$org/$repo/issues"
								params={{ org, repo }}
								className={CRUMB_LINK}
							>
								Issues
							</Link>
							<CrumbSep />
							<CrumbText>{id}</CrumbText>
						</RepoCrumbs>
						<button
							type="button"
							className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 font-medium text-[13px] text-foreground/90 transition-colors hover:bg-surface-1"
						>
							View on GitHub
							<ArrowUpRight
								size={13}
								strokeWidth={2}
								className="text-muted-foreground"
							/>
						</button>
					</div>

					{detail ? (
						<ThreadView
							detail={detail}
							org={org}
							repo={repo}
							highlightId={highlightId}
						/>
					) : (
						<p className="py-16 text-center text-muted-foreground text-sm">
							{content.isLoading ? "Loading…" : "Issue not found."}
						</p>
					)}
				</div>
			</ThreadDetailShell>
		</DashboardLayout>
	);
}
