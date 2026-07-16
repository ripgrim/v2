import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArmCallout } from "#/components/arming/arm-callout";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { RuleCard } from "#/components/rules/rule-card";
import { RuleFilters, type RuleSort } from "#/components/rules/rule-filters";
import { RuleHeaderStats } from "#/components/rules/rule-header-stats";
import { orgRepoQueryOptions } from "#/lib/org.query";
import {
	ruleConfigsQueryOptions,
	rulesStatsQueryOptions,
} from "#/lib/rules.query";

const routeApi = getRouteApi("/$org/$repo/rules");

export function RulesPage() {
	// Scoped to the URL's repo (§8) — the layout route already resolved it.
	const { org, repo: repoName } = routeApi.useParams();
	const { data: repo } = useQuery(orgRepoQueryOptions(org, repoName));
	const [sort, setSort] = useState<RuleSort>("active");
	const repoId = repo?.id ?? "";
	const { data: rules } = useQuery(ruleConfigsQueryOptions(org, repoId));
	const statsQuery = useQuery(rulesStatsQueryOptions(org, repoId));

	const fetchedStats = useRef(false);
	if (statsQuery.isLoading) {
		fetchedStats.current = true;
	}

	const sorted = useMemo(() => {
		if (!rules) {
			return [];
		}
		const copy = [...rules];
		copy.sort((a, b) =>
			sort === "az"
				? a.name.localeCompare(b.name)
				: b.matches24h - a.matches24h || a.name.localeCompare(b.name),
		);
		return copy;
	}, [rules, sort]);

	return (
		<DashboardLayout counts={{}}>
			<div className="mx-auto w-full max-w-4xl px-6 py-8">
				<header className="mb-6 flex items-center justify-between gap-4">
					<div>
						<h1 className="font-semibold text-2xl tracking-tight">Rules</h1>
						<p className="text-muted-foreground text-sm">
							boolean requirements every non-exempt contributor must meet.
						</p>
					</div>
					{repo ? (
						<span className="rounded-md border bg-card px-2.5 py-1.5 font-medium text-muted-foreground text-sm">
							{repo.fullName}
						</span>
					) : null}
				</header>

				{repo && !repo.armed ? (
					<ArmCallout
						className="mb-6"
						org={org}
						repo={repoName}
						repoFullName={repo.fullName}
						variant="banner"
					/>
				) : null}

				<div className="flex flex-col gap-6">
					{statsQuery.data ? (
						<RuleHeaderStats
							animate={fetchedStats.current}
							stats={statsQuery.data}
						/>
					) : null}
					{statsQuery.data && statsQuery.data.matches24h.value === 0 ? (
						<p className="rounded-lg border border-dashed px-4 py-3 text-center text-muted-foreground text-xs">
							no change requests evaluated in the last 24h — these rules take
							effect on the next one that opens.
						</p>
					) : null}
					<div className="flex items-center justify-end">
						<RuleFilters onSortChange={setSort} sort={sort} />
					</div>
					<div className="flex flex-col gap-3">
						{sorted.map((rule) => (
							<RuleCard
								key={rule.ruleId}
								org={org}
								repoId={repoId}
								rule={rule}
							/>
						))}
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}

export function RulesPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="mx-auto w-full max-w-4xl px-6 py-8">
				<div className="mb-6 h-8 w-40 animate-pulse rounded-md bg-surface-1" />
				<div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
					{Array.from({ length: 4 }, (_, i) => `stat-skel-${i}`).map((key) => (
						<div
							className="h-24 animate-pulse rounded-xl bg-surface-1"
							key={key}
						/>
					))}
				</div>
				<div className="flex flex-col gap-3">
					{Array.from({ length: 5 }, (_, i) => `rules-skel-${i}`).map((key) => (
						<div
							className="h-24 animate-pulse rounded-lg bg-surface-1"
							key={key}
						/>
					))}
				</div>
			</div>
		</DashboardLayout>
	);
}
