import type { Severity } from "#/lib/moderation.types";
import { getSeverityConfig } from "#/lib/severity";
import { cn } from "#/lib/utils";

export function SeverityBadge({
	severity,
	className,
}: {
	severity: Severity;
	className?: string;
}) {
	const { label, marker } = getSeverityConfig(severity);
	return (
		<span className={cn("inline-flex items-center gap-1.5", className)}>
			<span className={cn("size-1.5 rounded-full", marker)} aria-hidden />
			<span className="text-[11px] text-muted-foreground">{label}</span>
		</span>
	);
}
