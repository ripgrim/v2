import { InboxIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useMemo, useState } from "react";
import { QueueItemRow } from "#/components/moderation/queue-item-row";
import type { FlaggedItem, Reason } from "#/lib/moderation.types";
import { getReasonLabel } from "#/lib/reason";
import { getSeverityConfig } from "#/lib/severity";
import { cn } from "#/lib/utils";

type SortKey = "severity" | "newest";
type ReasonFilter = Reason | "all";

const REASON_FILTERS: ReasonFilter[] = [
	"all",
	"spam",
	"harassment",
	"off-topic",
	"automod",
	"nsfw",
];

export function QueueList({
	items,
	title,
}: {
	items: FlaggedItem[];
	title?: ReactNode;
}) {
	const [sort, setSort] = useState<SortKey>("severity");
	const [reason, setReason] = useState<ReasonFilter>("all");

	const visible = useMemo(() => {
		const filtered =
			reason === "all" ? items : items.filter((item) => item.reason === reason);
		return [...filtered].sort((a, b) => {
			if (sort === "newest") {
				return Date.parse(b.reportedAt) - Date.parse(a.reportedAt);
			}
			const delta =
				getSeverityConfig(b.severity).weight -
				getSeverityConfig(a.severity).weight;
			return delta !== 0
				? delta
				: Date.parse(b.reportedAt) - Date.parse(a.reportedAt);
		});
	}, [items, reason, sort]);

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3 px-3">
				{title ?? (
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-semibold tracking-tight">
							Moderation queue
						</h2>
						<span className="rounded-full bg-surface-1 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
							{visible.length}
						</span>
					</div>
				)}
				<div className="flex items-center gap-0.5 rounded-md bg-surface-0 p-0.5 w-fit">
					<SortButton
						active={sort === "severity"}
						onClick={() => setSort("severity")}
					>
						Severity
					</SortButton>
					<SortButton
						active={sort === "newest"}
						onClick={() => setSort("newest")}
					>
						Newest
					</SortButton>
				</div>
			</div>

			<div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3">
				{REASON_FILTERS.map((value) => (
					<FilterChip
						key={value}
						active={reason === value}
						onClick={() => setReason(value)}
					>
						{value === "all" ? "All reasons" : getReasonLabel(value)}
					</FilterChip>
				))}
			</div>

			{visible.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-16 text-center">
					<HugeiconsIcon
						icon={InboxIcon}
						size={22}
						strokeWidth={1.75}
						className="text-muted-foreground"
					/>
					<p className="text-sm font-medium">Queue is clear</p>
					<p className="text-xs text-muted-foreground">
						No flagged items match this filter.
					</p>
				</div>
			) : (
				<div className="flex flex-col">
					{visible.map((item) => (
						<QueueItemRow key={item.id} item={item} />
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
