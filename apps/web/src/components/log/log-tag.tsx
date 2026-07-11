import { cn } from "#/lib/utils";

/** Dot + muted label — restrained badge used for log action/status. */
export function LogTag({ dot, label }: { dot: string; label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
			<span className="text-[11px] text-muted-foreground">{label}</span>
		</span>
	);
}
