import { ScrollIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useMemo, useState } from "react";
import { LogRow } from "#/components/log/log-row";
import { Input } from "#/components/ui/input";
import type { LogAction, LogEntry } from "#/lib/log.types";
import { getActionTag } from "#/lib/log-config";
import { cn } from "#/lib/utils";

type ActionFilter = LogAction | "all";
type SourceFilter = "any" | "automod" | "report" | "manual";

const ACTIONS: ActionFilter[] = [
	"all",
	"removed",
	"hidden",
	"banned",
	"dismissed",
	"required-review",
];
const SOURCES: { key: SourceFilter; label: string }[] = [
	{ key: "any", label: "Any source" },
	{ key: "automod", label: "Automod" },
	{ key: "report", label: "Report" },
	{ key: "manual", label: "Manual" },
];

export function LogList({
	entries,
	title,
}: {
	entries: LogEntry[];
	title: ReactNode;
}) {
	const [action, setAction] = useState<ActionFilter>("all");
	const [source, setSource] = useState<SourceFilter>("any");
	const [query, setQuery] = useState("");

	const visible = useMemo(() => {
		const q = query.trim().toLowerCase();
		return entries.filter((e) => {
			if (action !== "all" && e.action !== action) return false;
			if (source !== "any" && e.caughtBy.kind !== source) return false;
			if (q) {
				const hay = [
					e.label,
					e.reason,
					e.author.login,
					e.moderator?.login ?? "",
					e.caughtBy.detail,
					e.caughtBy.reporter?.login ?? "",
					...e.items.map((i) => i.repoFullName),
				]
					.join(" ")
					.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	}, [entries, action, source, query]);

	return (
		<section className="flex flex-col gap-3">
			<div className="px-3">{title}</div>

			<div className="flex flex-col gap-4 px-3">
				<div className="flex items-center gap-2">
					<div className="relative flex w-full max-w-[260px] items-center">
						<HugeiconsIcon
							icon={Search01Icon}
							size={13}
							strokeWidth={2}
							className="pointer-events-none absolute left-2.5 text-muted-foreground"
						/>
						<Input
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search person, content, repo…"
							className="h-8 bg-surface-0 pl-7 text-[13px]"
						/>
					</div>

					<div className="ml-auto flex shrink-0 items-center gap-0.5 rounded-md bg-surface-0 p-0.5">
						{SOURCES.map((s) => (
							<button
								key={s.key}
								type="button"
								onClick={() => setSource(s.key)}
								className={cn(
									"rounded-[5px] px-2 py-1 font-medium text-xs transition-colors",
									source === s.key
										? "bg-card text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{s.label}
							</button>
						))}
					</div>
				</div>

				<div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
					{ACTIONS.map((value) => (
						<Chip
							key={value}
							active={action === value}
							onClick={() => setAction(value)}
						>
							{value === "all" ? "All actions" : getActionTag(value).label}
						</Chip>
					))}
				</div>
			</div>

			{visible.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-16 text-center">
					<HugeiconsIcon
						icon={ScrollIcon}
						size={22}
						strokeWidth={1.75}
						className="text-muted-foreground"
					/>
					<p className="font-medium text-sm">Nothing here</p>
					<p className="text-muted-foreground text-xs">
						No log entries match these filters.
					</p>
				</div>
			) : (
				<div className="flex flex-col">
					{visible.map((entry) => (
						<LogRow key={entry.id} entry={entry} />
					))}
				</div>
			)}
		</section>
	);
}

function Chip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"shrink-0 rounded-full border px-2.5 py-1 font-medium text-xs transition-colors",
				active
					? "border-transparent bg-primary text-primary-foreground"
					: "border-border text-muted-foreground hover:bg-surface-1 hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}
