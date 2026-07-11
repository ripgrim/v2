import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { DitherStatCard } from "#/components/charts/dither-stat-card";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { LogList } from "#/components/log/log-list";
import { QueueList } from "#/components/moderation/queue-list";
import { Skeleton } from "#/components/ui/skeleton";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import { moderationLogQueryOptions } from "#/lib/log.query";
import {
	moderationQueueQueryOptions,
	moderationStatsQueryOptions,
} from "#/lib/moderation.query";
import { MODERATOR } from "#/lib/site-config";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/")({
	ssr: false,
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
		void context.queryClient.prefetchQuery(moderationStatsQueryOptions());
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
		void context.queryClient.prefetchQuery(moderationLogQueryOptions());
	},
	component: DashboardPage,
});

function DashboardPage() {
	const queueQuery = useQuery(moderationQueueQueryOptions());
	const statsQuery = useQuery(moderationStatsQueryOptions());
	const rulesQuery = useQuery(automodRulesQueryOptions());
	const logQuery = useQuery(moderationLogQueryOptions());
	const [view, setView] = useState<"pending" | "log">("pending");

	if (queueQuery.error) throw queueQuery.error;
	if (statsQuery.error) throw statsQuery.error;

	// Only run the scramble intro when the stats actually had to fetch —
	// a cached navigation renders the values immediately.
	const fetchedStats = useRef(false);
	if (statsQuery.isLoading) fetchedStats.current = true;
	const animateStats = fetchedStats.current;

	const items = queueQuery.data ?? [];
	const counts = {
		queue: queueQuery.data?.length,
		automod: rulesQuery.data?.filter((rule) => rule.enabled).length,
	};

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<div className="overflow-stable h-full px-5 py-6 md:px-8 md:py-10">
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
						view === "pending" ? (
							<QueueList
								items={items}
								title={
									<ViewToggle
										view={view}
										setView={setView}
										count={items.length}
									/>
								}
							/>
						) : (
							<LogList
								entries={logQuery.data ?? []}
								title={
									<ViewToggle
										view={view}
										setView={setView}
										count={items.length}
									/>
								}
							/>
						)
					) : (
						<QueueSkeleton />
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

function ViewToggle({
	view,
	setView,
	count,
}: {
	view: "pending" | "log";
	setView: (v: "pending" | "log") => void;
	count: number;
}) {
	return (
		<div className="flex w-fit items-center gap-0.5 rounded-md bg-surface-0 p-0.5">
			<button
				type="button"
				onClick={() => setView("pending")}
				className={cn(
					"flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 font-medium text-xs transition-colors",
					view === "pending"
						? "bg-card text-foreground shadow-xs"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				Pending
				<span className="text-muted-foreground tabular-nums">{count}</span>
			</button>
			<button
				type="button"
				onClick={() => setView("log")}
				className={cn(
					"rounded-[5px] px-2.5 py-1 font-medium text-xs transition-colors",
					view === "log"
						? "bg-card text-foreground shadow-xs"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				Log
			</button>
		</div>
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
