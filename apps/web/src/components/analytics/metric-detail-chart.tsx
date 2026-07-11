"use client";

import { useMemo, useRef, useState } from "react";
import {
	Area,
	AreaChart,
	type ChartConfig,
	Tooltip,
} from "#/components/charts/dither-kit";
import type { RepoMetric } from "#/lib/repo-analytics.types";

/**
 * The "blown-up" detail chart for whichever metric card is selected. The engine
 * owns the scrub crosshair + gliding tooltip; clicking commits a point
 * (`onCommit`) for the drilldown. Metrics with no data render as a muted grey
 * flatline with interaction disabled.
 */
export function MetricDetailChart({
	metric,
	height = 192,
	committedIndex = null,
	onCommit,
}: {
	metric: RepoMetric;
	height?: number;
	/** A locked point (e.g. an open drilldown) — keeps the crosshair pinned. */
	committedIndex?: number | null;
	/** Click a point to inspect the comments behind it. */
	onCommit?: (index: number) => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<number | null>(null);

	const noData = metric.value === 0;
	// Flatten to a steady floor when there's nothing to show.
	const series = useMemo(
		() => (noData ? metric.series.map(() => 0) : metric.series),
		[metric.series, noData],
	);
	const len = series.length;
	const data = useMemo(() => series.map((value) => ({ value })), [series]);
	const config = useMemo<ChartConfig>(
		() => ({
			value: { label: metric.label, color: noData ? "grey" : metric.color },
		}),
		[metric.label, metric.color, noData],
	);

	const indexFromX = (clientX: number) => {
		const el = ref.current;
		if (!el || len < 2) return 0;
		const rect = el.getBoundingClientRect();
		const t = (clientX - rect.left) / rect.width;
		return Math.max(0, Math.min(len - 1, Math.round(t * (len - 1))));
	};

	return (
		<section className="flex flex-col gap-2.5">
			<div className="flex items-baseline gap-2">
				<h2 className="font-semibold text-foreground text-sm">
					{metric.label}
				</h2>
				<span className="text-muted-foreground text-xs">
					{noData
						? "no data"
						: hover != null
							? `point ${hover + 1} of ${len}`
							: "last 30 days"}
				</span>
			</div>

			<div
				ref={ref}
				className="relative w-full overflow-hidden rounded-lg"
				style={{ height, cursor: noData ? "default" : "crosshair" }}
				onPointerDown={
					noData ? undefined : (e) => onCommit?.(indexFromX(e.clientX))
				}
			>
				<AreaChart
					data={data}
					config={config}
					interactive={!noData}
					markerIndex={noData ? null : committedIndex}
					onHoverChange={setHover}
					bloom={noData ? "off" : "aura"}
					// Vertical headroom so the bloom glow isn't clipped by the container.
					margins={{ top: 28, right: 0, bottom: 18, left: 0 }}
					className="absolute inset-0"
				>
					<Area dataKey="value" variant="gradient" />
					{!noData && (
						<Tooltip
							valueFormatter={(value) =>
								`${Math.round(value).toLocaleString()}${metric.suffix ?? ""}`
							}
						/>
					)}
				</AreaChart>
			</div>
		</section>
	);
}
