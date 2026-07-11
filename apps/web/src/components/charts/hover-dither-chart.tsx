"use client";

import { type ComponentProps, useState } from "react";
import { DitherChart } from "#/components/charts/dither-chart";

/**
 * Wraps {@link DitherChart} with parent-driven hover so a large chart lifts into
 * focus when the pointer is anywhere over it — the metric cards already do this
 * via their own hover state; this gives standalone charts the same lift.
 */
export function HoverDitherChart(
	props: Omit<ComponentProps<typeof DitherChart>, "hovered">,
) {
	const [hovered, setHovered] = useState(false);
	return (
		<div
			className="h-full w-full"
			onPointerEnter={() => setHovered(true)}
			onPointerLeave={() => setHovered(false)}
		>
			<DitherChart {...props} hovered={hovered} />
		</div>
	);
}
