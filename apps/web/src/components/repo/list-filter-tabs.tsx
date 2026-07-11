import { cn } from "#/lib/utils";

/** Open / Closed segmented filter for the issue & pull lists. */
export function ListFilterTabs({
	value,
	onChange,
	openCount,
	closedCount,
}: {
	value: "open" | "closed";
	onChange: (value: "open" | "closed") => void;
	openCount: number;
	closedCount: number;
}) {
	return (
		<div className="flex items-center gap-1.5 text-[13px]">
			<Tab
				active={value === "open"}
				onClick={() => onChange("open")}
				label="Open"
				count={openCount}
			/>
			<Tab
				active={value === "closed"}
				onClick={() => onChange("closed")}
				label="Closed"
				count={closedCount}
			/>
		</div>
	);
}

function Tab({
	active,
	onClick,
	label,
	count,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
	count: number;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex h-8 items-center gap-1.5 rounded-lg px-3 font-medium transition-colors",
				active
					? "bg-surface-1 text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{label}
			<span className="tabular-nums text-muted-foreground">{count}</span>
		</button>
	);
}
