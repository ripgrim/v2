import type { Severity } from "#/lib/moderation.types";

export type SeverityConfig = {
	label: string;
	/** Dot color — the one place severity earns a hue. */
	marker: string;
	/** Sort weight — higher is more urgent. */
	weight: number;
};

const SEVERITY: Record<Severity, SeverityConfig> = {
	critical: { label: "Critical", marker: "bg-red-500", weight: 4 },
	high: { label: "High", marker: "bg-amber-500", weight: 3 },
	medium: { label: "Medium", marker: "bg-muted-foreground/60", weight: 2 },
	low: { label: "Low", marker: "bg-muted-foreground/30", weight: 1 },
};

export function getSeverityConfig(severity: Severity): SeverityConfig {
	return SEVERITY[severity];
}
