import type { RuleCategory } from "#/lib/automod.types";
import { getCategoryConfig } from "#/lib/automod-category";
import { cn } from "#/lib/utils";

export function CategoryPill({
	category,
	className,
}: {
	category: RuleCategory;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex h-5 items-center rounded-md bg-surface-2 px-1.5 text-[11px] font-medium text-muted-foreground",
				className,
			)}
		>
			{getCategoryConfig(category).label}
		</span>
	);
}
