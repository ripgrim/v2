import { useEffect, useState } from "react";
import { ActivityDrilldown } from "#/components/analytics/activity-drilldown";
import { MetricDetailChart } from "#/components/analytics/metric-detail-chart";
import { useSidePanel } from "#/components/layouts/dashboard-side-panel";
import type { RepoMetric } from "#/lib/repo-analytics.types";

/**
 * The focused-metric chart plus its click-to-inspect drilldown. Lives here (not
 * in the route body) so `useSidePanel` runs inside the provider that
 * DashboardLayout renders.
 */
export function ChartWithDrilldown({
	org,
	repo,
	metric,
	height,
}: {
	org: string;
	repo: string;
	metric: RepoMetric;
	height?: number;
}) {
	const { open, close } = useSidePanel();
	const [committed, setCommitted] = useState<number | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on metric switch
	useEffect(() => setCommitted(null), [metric.key]);

	return (
		<MetricDetailChart
			metric={metric}
			height={height}
			committedIndex={committed}
			onCommit={(index) => {
				setCommitted(index);
				open(
					`bucket:${metric.key}:${index}`,
					<ActivityDrilldown
						org={org}
						repo={repo}
						metric={metric}
						bucketIndex={index}
						onClose={() => {
							close();
							setCommitted(null);
						}}
					/>,
				);
			}}
		/>
	);
}
