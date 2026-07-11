import type { Label } from "#/lib/repo-content.types";
import { cn } from "#/lib/utils";

export function LabelPill({ label }: { label: Label }) {
	return (
		<span
			className={cn(
				"inline-flex h-[18px] shrink-0 items-center rounded-full px-2 font-medium text-[11px]",
				label.className,
			)}
		>
			{label.name}
		</span>
	);
}
