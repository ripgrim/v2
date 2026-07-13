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
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							{/* The actionable card — the queue you must clear. First, ringed,
							    and it drops you into the queue below. */}
							<DitherStatCard
								label="Sent to review"
								color="orange"
								delay={0}
								animate={animateStats}
								focused
								onClick={() =>
									document
										.getElementById("moderation-queue")
										?.scrollIntoView({ behavior: "smooth", block: "start" })
								}
								value={String(statsQuery.data.sentToReview.value)}
								delta={statsQuery.data.sentToReview.delta}
								series={statsQuery.data.sentToReview.series}
								goodDirection="down"
							/>
							<DitherStatCard
								label="Blocked · 24h"
								color="red"
								chartLayoutId="chart-moderation-blocked"
								linkSearch={{ source: "moderation", metric: "blocked" }}
								delay={90}
								animate={animateStats}
								value={String(statsQuery.data.blocked.value)}
								delta={statsQuery.data.blocked.delta}
								series={statsQuery.data.blocked.series}
								goodDirection="neutral"
							/>
							<DitherStatCard
								label="Passed · 24h"
								color="green"
								chartLayoutId="chart-moderation-passed"
								linkSearch={{ source: "moderation", metric: "passed" }}
								delay={180}
								animate={animateStats}
								value={String(statsQuery.data.passed.value)}
								delta={statsQuery.data.passed.delta}
								series={statsQuery.data.passed.series}
								goodDirection="up"
							/>
						</div>
					) : (
						<PanelSkeleton />
					)}

					{queueQuery.data ? (
						<div id="moderation-queue">
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
						</div>
					) : (
						<QueueSkeleton />
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

const QUEUE_SLOTS = ["a", "b", "c", "d", "e", "f"];
const CARD_SLOTS = ["review", "blocked", "passed"];

function PanelSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
