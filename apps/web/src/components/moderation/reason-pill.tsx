import type { Reason } from "#/lib/moderation.types";
import { getReasonLabel } from "#/lib/reason";
import { cn } from "#/lib/utils";

export function ReasonPill({
	reason,
	className,
}: {
	reason: Reason;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex h-5 items-center rounded-md bg-surface-2 px-1.5 text-[11px] font-medium text-muted-foreground",
				className,
			)}
		>
			{getReasonLabel(reason)}
		</span>
	);
}
