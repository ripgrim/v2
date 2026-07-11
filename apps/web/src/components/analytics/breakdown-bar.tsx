import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

/** A labelled horizontal bar — reused for "blocked by rule" and participants. */
export function BreakdownBar({
	label,
	value,
	max,
	flagged,
}: {
	label: ReactNode;
	value: number;
	max: number;
	flagged?: boolean;
}) {
	const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<span className="text-foreground/75 text-xs">{label}</span>
				<span className="font-mono text-[11px] text-muted-foreground tabular-nums">
					{value}
				</span>
			</div>
			<div className="flex h-1.5 overflow-hidden rounded-full bg-surface-1">
				<div
					className={cn("rounded-full", flagged ? "bg-red-500" : "bg-brand")}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
