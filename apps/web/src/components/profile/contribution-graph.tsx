import type { ContributionYear } from "#/lib/contributor.types";

// GitHub-style intensity ramp: empty cell, then four greens.
const LEVELS = ["#1b1b1f", "#0e4429", "#006d32", "#26a641", "#39d353"];

/**
 * A year of contributions as a 53×7 heatmap. Cells flex to fill the available
 * width so the graph never overflows the column, with the standard Less→More
 * legend beneath it.
 */
export function ContributionGraph({ year }: { year: ContributionYear }) {
	return (
		<div className="flex flex-col gap-2.5">
			<div className="flex gap-[3px]">
				{year.weeks.map((week, w) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed positional grid
						key={w}
						className="flex flex-1 flex-col gap-[3px]"
					>
						{week.map((lvl, d) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: fixed positional grid
								key={d}
								className="aspect-square w-full rounded-[2px]"
								style={{ backgroundColor: LEVELS[lvl] }}
							/>
						))}
					</div>
				))}
			</div>
			<div className="flex items-center justify-end gap-1.5">
				<span className="text-[11px] text-muted-foreground">Less</span>
				{LEVELS.map((color) => (
					<span
						key={color}
						className="size-2.5 rounded-[2px]"
						style={{ backgroundColor: color }}
					/>
				))}
				<span className="text-[11px] text-muted-foreground">More</span>
			</div>
		</div>
	);
}
