import { useMemo, useState } from "react";
import { Sparkline } from "#/components/charts/dither-kit";
import type { RepoMetric } from "#/lib/repo-analytics.types";
import { cn } from "#/lib/utils";

/**
 * A blended stat card for the analytics screens — label, value, then a
 * delta (repo dashboard) or a muted sub-context (thread cards), with a dither
 * spark that lifts into focus on card hover.
 */
export function RepoMetricCard({
	metric,
	focused,
	onClick,
}: {
	metric: RepoMetric;
	focused?: boolean;
	onClick?: () => void;
}) {
	const { label, value, delta, invertDelta, sub, series, color, suffix } =
		metric;
	const [hovered, setHovered] = useState(false);
	const good = delta == null ? true : invertDelta ? delta < 0 : delta > 0;
	const up = (delta ?? 0) > 0;
	// No data → a muted grey flatline instead of a colored spark over nothing.
	const noData = value === 0;
	const sparkData = useMemo(
		() => (noData ? series.map(() => 0) : series),
		[noData, series],
	);

	const body = (
		<div
			onPointerEnter={() => setHovered(true)}
			onPointerLeave={() => setHovered(false)}
			className={cn(
				"overflow-hidden rounded-xl bg-card ring-foreground/15",
				focused && "ring-1",
			)}
		>
			<div className="flex flex-col gap-1.5 px-3.5 pt-3.5 pb-2.5">
				<span className="text-muted-foreground text-xs">{label}</span>
				<div className="flex items-baseline gap-2">
					<span className="font-sans text-2xl text-foreground tabular-nums">
						{value.toLocaleString()}
						{suffix}
					</span>
					{delta != null ? (
						<span
							className={cn(
								"inline-flex items-center gap-1 font-mono text-[11px] tabular-nums",
								good ? "text-emerald-500" : "text-red-500",
							)}
						>
							<span className="text-[8px] leading-none">{up ? "▲" : "▼"}</span>
							{Math.abs(delta)}
						</span>
					) : sub ? (
						<span className="text-[11px] text-muted-foreground">{sub}</span>
					) : null}
				</div>
			</div>
			<div className="relative h-11">
				<Sparkline
					data={sparkData}
					color={noData ? "grey" : color}
					hovered={hovered && !noData}
					bloom={noData ? "off" : "aura"}
					className="absolute inset-0"
				/>
			</div>
		</div>
	);

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="block w-full rounded-xl text-left outline-none ring-ring/50 transition-shadow hover:ring-1 hover:ring-border focus-visible:ring-2"
			>
				{body}
			</button>
		);
	}
	return body;
}
