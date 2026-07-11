"use client";

import { motion } from "motion/react";
import { useMemo, useRef } from "react";
import type { DitherColor } from "#/components/charts/dither-chart";
import {
	Area,
	AreaChart,
	type ChartConfig,
	Tooltip,
} from "#/components/charts/dither-kit";

/**
 * Full-bleed interactive dither chart. The engine owns the scrub hover + the
 * gliding tooltip; this wrapper only commits a point on click (`onCommit`) and
 * supplies the shared-element `layoutId` so the spark morphs in from a card.
 */
export function AnalyticsChart({
	series,
	color,
	committedIndex,
	suffix,
	label,
	onCommit,
	layoutId,
}: {
	series: number[];
	color: DitherColor;
	committedIndex: number | null;
	suffix?: string;
	/** Series label shown in the tooltip. */
	label?: string;
	onCommit: (index: number) => void;
	/** Shared-element id — matches a home stat card so the spark morphs in. */
	layoutId?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);

	const data = useMemo(() => series.map((value) => ({ value })), [series]);
	const config = useMemo<ChartConfig>(
		() => ({ value: { label: label ?? "", color } }),
		[label, color],
	);

	const indexFromX = (clientX: number) => {
		const el = ref.current;
		if (!el) return 0;
		const rect = el.getBoundingClientRect();
		const t = (clientX - rect.left) / rect.width;
		return Math.max(
			0,
			Math.min(series.length - 1, Math.round(t * (series.length - 1))),
		);
	};

	return (
		<motion.div
			ref={ref}
			layoutId={layoutId}
			transition={{ type: "spring", stiffness: 320, damping: 34 }}
			className="relative h-full w-full cursor-crosshair overflow-hidden"
			onPointerDown={(e) => onCommit(indexFromX(e.clientX))}
		>
			<AreaChart
				data={data}
				config={config}
				markerIndex={committedIndex}
				bloom="aura"
				// Vertical headroom so the bloom glow isn't clipped by the container.
				margins={{ top: 28, right: 0, bottom: 18, left: 0 }}
				className="absolute inset-0"
			>
				<Area dataKey="value" variant="gradient" />
				<Tooltip valueFormatter={(value) => `${value}${suffix ?? ""}`} />
			</AreaChart>
		</motion.div>
	);
}
