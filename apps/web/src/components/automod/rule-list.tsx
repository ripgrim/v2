import { SearchMinusIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { RuleRow } from "#/components/automod/rule-row";
import type { AutomodRule, RuleCategory } from "#/lib/automod.types";
import { getCategoryConfig } from "#/lib/automod-category";
import { cn } from "#/lib/utils";

type SortKey = "active" | "fp-rate" | "name";
type CategoryFilter = RuleCategory | "all";

const CATEGORY_FILTERS: CategoryFilter[] = [
	"all",
	"blocklist",
	"heuristic",
	"classifier",
	"regex",
];

export function RuleList({ rules }: { rules: AutomodRule[] }) {
	const [sort, setSort] = useState<SortKey>("active");
	const [category, setCategory] = useState<CategoryFilter>("all");

	const visible = useMemo(() => {
		const filtered =
			category === "all"
				? rules
				: rules.filter((rule) => rule.category === category);
		return [...filtered].sort((a, b) => {
			if (sort === "name") return a.name.localeCompare(b.name);
			if (sort === "fp-rate") {
				return b.falsePositiveRate - a.falsePositiveRate;
			}
			return b.matches24h - a.matches24h;
		});
	}, [rules, category, sort]);

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3 px-3">
				<div className="flex items-center gap-2">
					<h2 className="text-sm font-semibold tracking-tight">Rules</h2>
					<span className="rounded-full bg-surface-1 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
						{visible.length}
					</span>
				</div>
				<div className="flex items-center gap-0.5 rounded-md bg-surface-0 p-0.5 w-fit">
					<SortButton
						active={sort === "active"}
						onClick={() => setSort("active")}
					>
						Most active
					</SortButton>
					<SortButton
						active={sort === "fp-rate"}
						onClick={() => setSort("fp-rate")}
					>
						FP rate
					</SortButton>
					<SortButton active={sort === "name"} onClick={() => setSort("name")}>
						A–Z
					</SortButton>
				</div>
			</div>

			<div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3">
				{CATEGORY_FILTERS.map((value) => (
					<FilterChip
						key={value}
						active={category === value}
						onClick={() => setCategory(value)}
					>
						{value === "all"
							? "All categories"
							: getCategoryConfig(value).label}
					</FilterChip>
				))}
			</div>

			{visible.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-16 text-center">
					<HugeiconsIcon
						icon={SearchMinusIcon}
						size={22}
						strokeWidth={1.75}
						className="text-muted-foreground"
					/>
					<p className="text-sm font-medium">No rules here</p>
					<p className="text-xs text-muted-foreground">
						No automod rules match this category.
					</p>
				</div>
			) : (
				<div className="flex flex-col">
					{visible.map((rule) => (
						<RuleRow key={rule.id} rule={rule} />
					))}
				</div>
			)}
		</section>
	);
}

function SortButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors",
				active
					? "bg-card text-foreground shadow-xs"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}

function FilterChip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
				active
					? "border-transparent bg-primary text-primary-foreground"
					: "border-border text-muted-foreground hover:bg-surface-1 hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}
