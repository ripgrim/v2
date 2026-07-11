import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { type ReactNode, useMemo } from "react";
import type { DitherColor } from "#/components/charts/dither-chart";
import {
	Area,
	AreaChart,
	type ChartConfig,
} from "#/components/charts/dither-kit";
import { ScrambleText } from "#/components/charts/scramble-text";
import { cn } from "#/lib/utils";

export type DitherStatCardProps = {
	label: string;
	value: string;
	delta: number;
	/** When true a positive delta reads as bad (down = good). */
	invertDelta?: boolean;
	series: number[];
	color: DitherColor;
	/** Stagger the scramble intro across a row of cards. */
	delay?: number;
	/** Only scramble on a genuine load — skip when data was cached. */
	animate?: boolean;
	/** When set, the card links into the analytics view for this metric. */
	linkSearch?: { source: "moderation" | "automod"; metric: string };
	/** Replaces the scrambled value (e.g. a live NumberFlow on analytics). */
	valueNode?: ReactNode;
	/** Rings the card to mark it as the focused metric. */
	focused?: boolean;
	/** When set, the card behaves as a tab button selecting this metric. */
	onClick?: () => void;
	/**
	 * Shared-element id for the mini chart. Match this to the analytics big
	 * chart's `layoutId` so the spark morphs into it across the navigation.
	 */
	chartLayoutId?: string;
	/** Override the card surface (e.g. a darker panel on the analytics page). */
	className?: string;
};

export function DitherStatCard({
	label,
	value,
	delta,
	invertDelta,
	series,
	color,
	delay = 0,
	animate = true,
	linkSearch,
	valueNode,
	focused,
	onClick,
	chartLayoutId,
	className,
}: DitherStatCardProps) {
	const good = invertDelta ? delta < 0 : delta > 0;
	const up = delta > 0;

	// The composable dither chart takes rows + a series config; the sparkline is a
	// single series keyed "v".
	const chartData = useMemo(() => series.map((v) => ({ v })), [series]);
	const chartConfig = useMemo<ChartConfig>(() => ({ v: { color } }), [color]);

	const body = (
		<div
			className={cn(
				"overflow-hidden rounded-xl bg-card ring-foreground/15",
				focused && "ring-1",
				className,
			)}
		>
			<div className="flex flex-col gap-1.5 px-3.5 pt-3.5 pb-2.5">
				<ScrambleText
					text={label}
					delay={delay}
					animate={animate}
					className="text-xs text-muted-foreground"
				/>
				<div className="flex items-baseline gap-2">
					{valueNode ?? (
						<ScrambleText
							text={value}
							delay={delay}
							animate={animate}
							className="font-sans text-2xl text-foreground"
						/>
					)}
					<span
						className={cn(
							"inline-flex items-center gap-1 font-mono text-[11px] tabular-nums",
							good ? "text-emerald-500" : "text-red-500",
						)}
					>
						<span className="text-[8px] leading-none">{up ? "▲" : "▼"}</span>
						{Math.abs(delta)}
					</span>
				</div>
			</div>
			<motion.div
				layoutId={chartLayoutId}
				transition={{ type: "spring", stiffness: 320, damping: 34 }}
				className="relative h-11"
			>
				<AreaChart
					data={chartData}
					config={chartConfig}
					interactive={false}
					animate={animate}
					bloom="aura"
					margins={{ top: 0, right: 0, bottom: 0, left: 0 }}
					className="absolute inset-0"
				>
					<Area dataKey="v" variant="gradient" />
				</AreaChart>
			</motion.div>
		</div>
	);

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="block w-full rounded-xl text-left outline-none ring-ring/50 transition-shadow focus-visible:ring-2 hover:ring-1 hover:ring-border"
			>
				{body}
			</button>
		);
	}

	if (linkSearch) {
		return (
			<Link
				to="/analytics"
				search={linkSearch}
				className="block rounded-xl outline-none ring-ring/50 transition-shadow focus-visible:ring-2 hover:ring-1 hover:ring-border"
			>
				{body}
			</Link>
		);
	}

	return body;
}
