import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { RuleList } from "#/components/automod/rule-list";
import { DitherStatCard } from "#/components/charts/dither-stat-card";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";
import {
	automodRulesQueryOptions,
	automodStatsQueryOptions,
} from "#/lib/automod.query";
import { moderationQueueQueryOptions } from "#/lib/moderation.query";
import { MODERATOR } from "#/lib/site-config";

export const Route = createFileRoute("/automod")({
	ssr: false,
	loader: ({ context }) => {
		void context.queryClient.prefetchQuery(automodRulesQueryOptions());
		void context.queryClient.prefetchQuery(automodStatsQueryOptions());
		void context.queryClient.prefetchQuery(moderationQueueQueryOptions());
	},
	component: AutomodPage,
});

function AutomodPage() {
	const rulesQuery = useQuery(automodRulesQueryOptions());
	const statsQuery = useQuery(automodStatsQueryOptions());
	const queueQuery = useQuery(moderationQueueQueryOptions());

	if (rulesQuery.error) throw rulesQuery.error;
	if (statsQuery.error) throw statsQuery.error;

	// Scramble the stats only on a real fetch, not on cached navigations.
	const fetchedStats = useRef(false);
	if (statsQuery.isLoading) fetchedStats.current = true;
	const animateStats = fetchedStats.current;

	const rules = rulesQuery.data ?? [];
	const counts = {
		queue: queueQuery.data?.length,
		automod: rulesQuery.data
			? rules.filter((rule) => rule.enabled).length
			: undefined,
	};

	return (
		<DashboardLayout moderator={MODERATOR} counts={counts}>
			<div className="overflow-stable h-full px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<header className="flex flex-col gap-1.5">
						<h1 className="text-2xl font-semibold tracking-tight">Automod</h1>
						<p className="text-sm text-muted-foreground">
							Tune the rules that flag, hide, and auto-action content before it
							reaches the queue.
						</p>
					</header>

					{statsQuery.data ? (
						<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
							<DitherStatCard
								label="Active rules"
								color="blue"
								chartLayoutId="chart-automod-rules"
								linkSearch={{ source: "automod", metric: "rules" }}
								delay={0}
								animate={animateStats}
								value={String(statsQuery.data.activeRules.value)}
								delta={statsQuery.data.activeRules.delta}
								series={statsQuery.data.activeRules.series}
							/>
							<DitherStatCard
								label="Matches · 24h"
								color="purple"
								chartLayoutId="chart-automod-matches"
								linkSearch={{ source: "automod", metric: "matches" }}
								delay={90}
								animate={animateStats}
								value={String(statsQuery.data.matches24h.value)}
								delta={statsQuery.data.matches24h.delta}
								series={statsQuery.data.matches24h.series}
								invertDelta
							/>
							<DitherStatCard
								label="FP rate"
								color="pink"
								chartLayoutId="chart-automod-fp"
								linkSearch={{ source: "automod", metric: "fp" }}
								delay={180}
								animate={animateStats}
								value={`${statsQuery.data.falsePositiveRate.value}%`}
								delta={statsQuery.data.falsePositiveRate.delta}
								series={statsQuery.data.falsePositiveRate.series}
								invertDelta
							/>
							<DitherStatCard
								label="Actioned · 24h"
								color="orange"
								chartLayoutId="chart-automod-actioned"
								linkSearch={{ source: "automod", metric: "actioned" }}
								delay={270}
								animate={animateStats}
								value={String(statsQuery.data.autoActioned24h.value)}
								delta={statsQuery.data.autoActioned24h.delta}
								series={statsQuery.data.autoActioned24h.series}
							/>
						</div>
					) : (
						<PanelSkeleton />
					)}

					{rulesQuery.data ? <RuleList rules={rules} /> : <RuleListSkeleton />}
				</div>
			</div>
		</DashboardLayout>
	);
}

const RULE_SLOTS = ["a", "b", "c", "d", "e", "f"];
const CARD_SLOTS = ["rules", "matches", "fp", "actioned"];

function PanelSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
			{CARD_SLOTS.map((slot) => (
				<Skeleton key={slot} className="h-28 rounded-xl" />
			))}
		</div>
	);
}

function RuleListSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			<Skeleton className="mx-3 h-5 w-40" />
			<div className="flex flex-col gap-1">
				{RULE_SLOTS.map((slot) => (
					<Skeleton key={slot} className="h-14 rounded-lg" />
				))}
			</div>
		</div>
	);
}
