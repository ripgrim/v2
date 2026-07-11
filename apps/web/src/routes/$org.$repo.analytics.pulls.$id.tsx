import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, GitMerge, GitPullRequest, X } from "lucide-react";
import { useState } from "react";
import { BreakdownBar } from "#/components/analytics/breakdown-bar";
import { ChartWithDrilldown } from "#/components/analytics/chart-with-drilldown";
import {
	CRUMB_LINK,
	CrumbSep,
	CrumbText,
	RepoCrumbs,
} from "#/components/analytics/repo-crumbs";
import { RepoMetricCard } from "#/components/analytics/repo-metric-card";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { AuthorLink } from "#/components/repo/author-link";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import { CHECK_DOT, THREAD_STATUS } from "#/lib/repo-analytics.config";
import { repoAnalyticsQueryOptions } from "#/lib/repo-analytics.query";
import { MODERATOR } from "#/lib/site-config";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/$org/$repo/analytics/pulls/$id")({
	ssr: false,
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(
			repoAnalyticsQueryOptions(params.org, params.repo),
		);
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
	},
	component: PullAnalyticsPage,
});

function PullAnalyticsPage() {
	const { org, repo, id } = Route.useParams();
	const analytics = useQuery(repoAnalyticsQueryOptions(org, repo));
	const queue = useQuery(moderationQueueQueryOptions());
	const rules = useQuery(automodRulesQueryOptions());

	const counts = {
		queue: queue.data?.length,
		automod: rules.data?.filter((rule) => rule.enabled).length,
	};

	const [focusedKey, setFocusedKey] = useState<string | null>(null);

	const thread = analytics.data?.threads[`pulls/${id}`];
	const status = thread ? THREAD_STATUS[thread.status] : null;
	const HeaderIcon = thread?.status === "merged" ? GitMerge : GitPullRequest;
	const focused =
		thread?.metrics.find((m) => m.key === focusedKey) ?? thread?.metrics[0];
	const maxParticipant = Math.max(
		...(thread?.byParticipant.map((p) => p.count) ?? [1]),
	);

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<div className="overflow-stable h-full px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
					<div className="flex items-center justify-between gap-4">
						<RepoCrumbs org={org} repo={repo}>
							<CrumbSep />
							<Link
								to="/$org/$repo/analytics"
								params={{ org, repo }}
								className={CRUMB_LINK}
							>
								Analytics
							</Link>
							<CrumbSep />
							<span className="text-[13px] text-muted-foreground">pulls</span>
							<CrumbSep />
							<CrumbText>{id}</CrumbText>
						</RepoCrumbs>
						<Link
							to="/$org/$repo/pulls/$id"
							params={{ org, repo, id }}
							className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 font-medium text-[13px] text-foreground/90 transition-colors hover:bg-surface-1"
						>
							View conversation
							<ArrowUpRight
								size={13}
								strokeWidth={2}
								className="text-muted-foreground"
							/>
						</Link>
					</div>

					{thread && status ? (
						<>
							<header className="flex items-start gap-3">
								<HeaderIcon
									size={18}
									strokeWidth={1.9}
									className="mt-0.5 shrink-0 text-violet-500"
								/>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<div className="flex items-baseline gap-2">
										<h1 className="font-semibold text-xl text-foreground tracking-tight">
											{thread.title}
										</h1>
										<span className="text-muted-foreground text-sm">
											#{thread.number}
										</span>
									</div>
									<p className="text-muted-foreground text-[13px]">
										{thread.meta}
									</p>
								</div>
								<span className="flex h-[22px] shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5">
									<span className={cn("size-1.5 rounded-full", status.dot)} />
									<span className="font-medium text-[11px] text-foreground/80">
										{status.label}
									</span>
								</span>
							</header>

							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								{thread.metrics.map((m) => (
									<RepoMetricCard
										key={m.key}
										metric={m}
										focused={m.key === focused?.key}
										onClick={() => setFocusedKey(m.key)}
									/>
								))}
							</div>

							{focused ? (
								<ChartWithDrilldown
									org={org}
									repo={repo}
									metric={focused}
									height={176}
								/>
							) : null}

							<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
								<section className="flex flex-1 flex-col gap-3.5">
									<h2 className="font-semibold text-sm text-foreground">
										Activity by participant
									</h2>
									<div className="flex flex-col gap-2.5">
										{thread.byParticipant.map((p) => (
											<BreakdownBar
												key={p.login}
												label={
													<AuthorLink
														org={org}
														repo={repo}
														login={p.login}
														at
														className="text-foreground/75"
													/>
												}
												value={p.count}
												max={maxParticipant}
												flagged={p.flagged}
											/>
										))}
									</div>
								</section>

								<section className="flex flex-1 flex-col gap-2.5">
									<h2 className="font-semibold text-sm text-foreground">
										Checks &amp; reviews
									</h2>
									<div className="flex flex-col">
										{thread.checks?.map((c) => (
											<div
												key={c.title}
												className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
											>
												{c.kind === "review" && c.actor ? (
													<img
														src={`https://github.com/${c.actor}.png`}
														alt={c.actor}
														className="size-5 shrink-0 rounded-full border border-border bg-surface-2"
													/>
												) : c.status === "Failed" ? (
													<X
														size={15}
														strokeWidth={2.5}
														className="shrink-0 text-red-500"
													/>
												) : (
													<Check
														size={15}
														strokeWidth={2.5}
														className="shrink-0 text-emerald-500"
													/>
												)}
												<div className="flex min-w-0 flex-1 flex-col gap-px">
													<span className="truncate font-medium text-[13px] text-foreground">
														{c.title}
													</span>
													<span className="truncate text-[11px] text-muted-foreground">
														{c.detail}
													</span>
												</div>
												<span className="flex shrink-0 items-center gap-1.5">
													<span
														className={cn(
															"size-1.5 rounded-full",
															CHECK_DOT[c.status],
														)}
													/>
													<span className="text-[11px] text-muted-foreground">
														{c.status}
													</span>
												</span>
											</div>
										))}
									</div>
								</section>
							</div>
						</>
					) : (
						<p className="py-16 text-center text-muted-foreground text-sm">
							{analytics.isLoading ? "Loading…" : "Thread not found."}
						</p>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
