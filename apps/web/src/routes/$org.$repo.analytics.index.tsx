import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Calendar,
	ChevronDown,
	ChevronRight,
	CircleDot,
	GitMerge,
	GitPullRequest,
} from "lucide-react";
import { BreakdownBar } from "#/components/analytics/breakdown-bar";
import { ChartWithDrilldown } from "#/components/analytics/chart-with-drilldown";
import {
	CrumbSep,
	CrumbText,
	RepoCrumbs,
} from "#/components/analytics/repo-crumbs";
import { RepoMetricCard } from "#/components/analytics/repo-metric-card";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { RepoTabs } from "#/components/repo/repo-tabs";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import { repoAnalyticsQueryOptions } from "#/lib/repo-analytics.query";
import type { ActiveThread } from "#/lib/repo-analytics.types";
import { MODERATOR } from "#/lib/site-config";

/** Optional so deep-links and sibling links don't have to carry them. */
type AnalyticsSearch = { metric?: string; range?: string };

export const Route = createFileRoute("/$org/$repo/analytics/")({
	ssr: false,
	validateSearch: (search: Record<string, unknown>): AnalyticsSearch => ({
		metric: typeof search.metric === "string" ? search.metric : undefined,
		range: typeof search.range === "string" ? search.range : undefined,
	}),
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(
			repoAnalyticsQueryOptions(params.org, params.repo),
		);
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
	},
	component: RepoAnalyticsPage,
});

function RepoAnalyticsPage() {
	const { org, repo } = Route.useParams();
	const metric = Route.useSearch().metric ?? "comments";
	const navigate = Route.useNavigate();

	const analytics = useQuery(repoAnalyticsQueryOptions(org, repo));
	const queue = useQuery(moderationQueueQueryOptions());
	const rules = useQuery(automodRulesQueryOptions());

	const counts = {
		queue: queue.data?.length,
		automod: rules.data?.filter((rule) => rule.enabled).length,
	};

	const data = analytics.data;
	const focused =
		data?.metrics.find((m) => m.key === metric) ?? data?.metrics[0];
	const maxBlocked = Math.max(
		...(data?.blockedByRule.map((r) => r.count) ?? [1]),
	);

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<div className="overflow-stable h-full px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
					<div className="flex h-8 items-center justify-between gap-4">
						<RepoCrumbs org={org} repo={repo}>
							<CrumbSep />
							<CrumbText>Analytics</CrumbText>
						</RepoCrumbs>
						<button
							type="button"
							className="flex h-8 items-center gap-2 rounded-lg border border-border px-3 font-medium text-[13px] text-foreground/90 transition-colors hover:bg-surface-1"
						>
							<Calendar
								size={13}
								strokeWidth={2}
								className="text-muted-foreground"
							/>
							Last 30 days
							<ChevronDown
								size={13}
								strokeWidth={2}
								className="text-muted-foreground"
							/>
						</button>
					</div>

					<RepoTabs org={org} repo={repo} active="analytics" />

					{data && focused ? (
						<>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{data.metrics.map((m) => (
									<RepoMetricCard
										key={m.key}
										metric={m}
										focused={m.key === focused.key}
										onClick={() =>
											navigate({
												search: (prev) => ({ ...prev, metric: m.key }),
												replace: true,
											})
										}
									/>
								))}
							</div>

							<ChartWithDrilldown
								org={org}
								repo={repo}
								metric={focused}
								height={192}
							/>

							<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
								<section className="flex flex-1 flex-col gap-3.5">
									<h2 className="font-semibold text-foreground text-sm">
										Blocked by rule
									</h2>
									<div className="flex flex-col gap-2.5">
										{data.blockedByRule.map((r) => (
											<BreakdownBar
												key={r.rule}
												label={r.rule}
												value={r.count}
												max={maxBlocked}
											/>
										))}
									</div>
								</section>

								<section className="flex flex-1 flex-col gap-2.5">
									<h2 className="font-semibold text-foreground text-sm">
										Most active threads
									</h2>
									<div className="flex flex-col">
										{data.activeThreads.map((thread) => (
											<ThreadLink
												key={`${thread.kind}-${thread.number}`}
												org={org}
												repo={repo}
												thread={thread}
											/>
										))}
									</div>
								</section>
							</div>
						</>
					) : (
						<p className="py-16 text-center text-muted-foreground text-sm">
							Loading analytics…
						</p>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

function ThreadLink({
	org,
	repo,
	thread,
}: {
	org: string;
	repo: string;
	thread: ActiveThread;
}) {
	const Icon =
		thread.kind === "issue"
			? CircleDot
			: thread.status === "merged"
				? GitMerge
				: GitPullRequest;
	const iconColor =
		thread.kind === "pull" && thread.status === "merged"
			? "text-violet-500"
			: "text-muted-foreground";
	const sub =
		thread.blocked > 0
			? `${thread.comments} comments · ${thread.blocked} blocked`
			: `${thread.comments} comments`;
	const inner = (
		<>
			<Icon size={15} strokeWidth={2} className={`shrink-0 ${iconColor}`} />
			<div className="flex min-w-0 flex-1 flex-col gap-px">
				<span className="truncate font-medium text-[13px] text-foreground">
					{thread.title} #{thread.number}
				</span>
				<span className="truncate text-[11px] text-muted-foreground">
					{sub}
				</span>
			</div>
			<ChevronRight
				size={14}
				strokeWidth={2}
				className="shrink-0 text-muted-foreground"
			/>
		</>
	);
	const className =
		"flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted";
	if (thread.kind === "issue") {
		return (
			<Link
				to="/$org/$repo/analytics/issues/$id"
				params={{ org, repo, id: String(thread.number) }}
				className={className}
			>
				{inner}
			</Link>
		);
	}
	return (
		<Link
			to="/$org/$repo/analytics/pulls/$id"
			params={{ org, repo, id: String(thread.number) }}
			className={className}
		>
			{inner}
		</Link>
	);
}
