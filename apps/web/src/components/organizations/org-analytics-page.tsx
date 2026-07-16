import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { DashboardLayout } from "#/components/layouts/dashboard-layout";
import { Skeleton } from "#/components/ui/skeleton";
import { orgAnalyticsQueryOptions } from "#/lib/org.query";

const route = getRouteApi("/$org/analytics");

/**
 * §8 — /:org/analytics is THIN: aggregate counts across the org's repos,
 * nothing more. Depth (charts, breakdowns) lives at /:org/:repo/analytics.
 */
export function OrgAnalyticsPage() {
	const { org } = route.useParams();
	const { data: summary, error } = useQuery(orgAnalyticsQueryOptions(org));

	if (error) {
		throw error;
	}

	return (
		<DashboardLayout counts={{}}>
			<div className="px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<header className="flex flex-col gap-1.5">
						<h1 className="font-semibold text-2xl tracking-tight">Analytics</h1>
						<p className="text-muted-foreground text-sm">
							totals across this org's repos. per-repo analytics live on each
							repo's page.
						</p>
					</header>

					{summary ? (
						<div className="grid grid-cols-2 gap-3 md:grid-cols-5">
							<StatCard label="repos" value={summary.repos} />
							<StatCard label="armed" value={summary.armedRepos} />
							<StatCard label="events (24h)" value={summary.events24h} />
							<StatCard label="blocked (24h)" value={summary.blocked24h} />
							<StatCard
								label="awaiting review"
								value={summary.pendingModeration}
							/>
						</div>
					) : (
						<StatGridSkeleton />
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col gap-1.5 rounded-xl bg-card px-3.5 py-3.5">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="font-sans text-2xl text-foreground tabular-nums">
				{value}
			</span>
		</div>
	);
}

function StatGridSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-5">
			{["a", "b", "c", "d", "e"].map((slot) => (
				<Skeleton className="h-20 rounded-xl" key={slot} />
			))}
		</div>
	);
}

export function OrgAnalyticsPageSkeleton() {
	return (
		<DashboardLayout counts={{}}>
			<div className="px-5 py-6 md:px-8 md:py-10">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
					<header className="flex flex-col gap-1.5">
						<Skeleton className="h-8 w-40" />
						<Skeleton className="h-5 w-80" />
					</header>
					<StatGridSkeleton />
				</div>
			</div>
		</DashboardLayout>
	);
}
