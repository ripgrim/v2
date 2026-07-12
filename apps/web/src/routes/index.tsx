import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { DitherStatCard } from "#/components/charts/dither-stat-card";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import {
	ModerationQueue,
	moderationQueueOptions,
} from "#/components/moderation/moderation-queue";
import { Skeleton } from "#/components/ui/skeleton";
import { moderationStatsQueryOptions } from "#/lib/moderation.query";

export const Route = createFileRoute("/")({
	ssr: false,
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(moderationQueueOptions());
		void context.queryClient.prefetchQuery(moderationStatsQueryOptions());
	},
	component: DashboardPage,
});

function DashboardPage() {
	const queueQuery = useQuery(moderationQueueOptions());
	const statsQuery = useQuery(moderationStatsQueryOptions());

	if (queueQuery.error) throw queueQuery.error;
	if (statsQuery.error) throw statsQuery.error;

	// Only run the scramble intro when the stats actually had to fetch —
	// a cached navigation renders the values immediately.
	const fetchedStats = useRef(false);
	if (statsQuery.isLoading) fetchedStats.current = true;
	const animateStats = fetchedStats.current;

	const items = queueQuery.data ?? [];
	const counts = { queue: queueQuery.data?.length };

	return (
		<DashboardLayout counts={counts}>
			<div className="px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<header className="flex flex-col gap-1.5">
						<h1 className="text-2xl font-semibold tracking-tight">
							Moderation
						</h1>
						<p className="text-sm text-muted-foreground">
							Triage flagged issues, pull requests, and comments across your
							organization.
						</p>
					</header>

					{statsQuery.data ? (
						<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
							<DitherStatCard
								label="Pending"
								color="red"
								chartLayoutId="chart-moderation-pending"
								linkSearch={{ source: "moderation", metric: "pending" }}
								delay={0}
								animate={animateStats}
								value={String(statsQuery.data.pendingReports.value)}
								delta={statsQuery.data.pendingReports.delta}
								series={statsQuery.data.pendingReports.series}
								invertDelta
							/>
							<DitherStatCard
								label="Resolved today"
								color="blue"
								chartLayoutId="chart-moderation-resolved"
								linkSearch={{ source: "moderation", metric: "resolved" }}
								delay={90}
								animate={animateStats}
								value={String(statsQuery.data.resolvedToday.value)}
								delta={statsQuery.data.resolvedToday.delta}
								series={statsQuery.data.resolvedToday.series}
							/>
							<DitherStatCard
								label="Automod · 24h"
								color="purple"
								chartLayoutId="chart-moderation-automod"
								linkSearch={{ source: "moderation", metric: "automod" }}
								delay={180}
								animate={animateStats}
								value={String(statsQuery.data.automodHits24h.value)}
								delta={statsQuery.data.automodHits24h.delta}
								series={statsQuery.data.automodHits24h.series}
								invertDelta
							/>
							<DitherStatCard
								label="Banned"
								color="orange"
								chartLayoutId="chart-moderation-banned"
								linkSearch={{ source: "moderation", metric: "banned" }}
								delay={270}
								animate={animateStats}
								value={String(statsQuery.data.bannedUsers.value)}
								delta={statsQuery.data.bannedUsers.delta}
								series={statsQuery.data.bannedUsers.series}
							/>
						</div>
					) : (
						<PanelSkeleton />
					)}

					{queueQuery.data ? (
						<ModerationQueue
							title={
								<h2 className="font-medium text-sm">
									pending{" "}
									<span className="text-muted-foreground tabular-nums">
										{items.length}
									</span>
								</h2>
							}
						/>
					) : (
						<QueueSkeleton />
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

const QUEUE_SLOTS = ["a", "b", "c", "d", "e", "f"];
const CARD_SLOTS = ["pending", "resolved", "automod", "banned"];

function PanelSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
			{CARD_SLOTS.map((slot) => (
				<Skeleton key={slot} className="h-28 rounded-xl" />
			))}
		</div>
	);
}

function QueueSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			<Skeleton className="mx-3 h-5 w-40" />
			<div className="flex flex-col gap-1">
				{QUEUE_SLOTS.map((slot) => (
					<Skeleton key={slot} className="h-14 rounded-lg" />
				))}
			</div>
		</div>
	);
}
