import { Layers } from "lucide-react";
import { memo } from "react";
import { useSidePanel } from "#/components/layouts/dashboard-side-panel";
import { LogDetail } from "#/components/log/log-detail";
import { LogTag } from "#/components/log/log-tag";
import { formatRelativeTime } from "#/lib/format-relative-time";
import { getItemTypeConfig } from "#/lib/item-type";
import type { LogEntry } from "#/lib/log.types";
import { getActionTag, getCaughtByLabel, getStatusTag } from "#/lib/log-config";
import { cn } from "#/lib/utils";

export const LogRow = memo(function LogRow({ entry }: { entry: LogEntry }) {
	const { activeKey, open, close } = useSidePanel();
	const isActive = activeKey === entry.id;
	const isBundle = entry.items.length > 1;
	const first = entry.items[0];
	const TypeIcon = isBundle ? Layers : getItemTypeConfig(first.type).icon;
	const action = getActionTag(entry.action);
	const statusTag = getStatusTag(entry.status);

	const where = isBundle
		? `${entry.items.length} items`
		: `${first.repoFullName} #${first.number}`;

	return (
		<div className={cn("group relative rounded-lg", isActive && "bg-muted")}>
			<button
				type="button"
				aria-pressed={isActive}
				aria-label={isActive ? `Close ${entry.label}` : `Open ${entry.label}`}
				onClick={() =>
					isActive ? close() : open(entry.id, <LogDetail entryId={entry.id} />)
				}
				className="absolute inset-0 z-0 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 group-hover:bg-muted"
			/>

			<div className="pointer-events-none relative z-10 flex items-center gap-3 px-3 py-2.5">
				<span className="mt-0.5 shrink-0 self-start text-muted-foreground">
					<TypeIcon size={15} strokeWidth={2} />
				</span>

				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<p className="truncate font-medium text-sm">{entry.label}</p>
						{isBundle ? (
							<span className="shrink-0 rounded-md bg-surface-2 px-1 font-medium text-[10px] text-muted-foreground tabular-nums">
								×{entry.items.length}
							</span>
						) : null}
					</div>
					<p className="truncate text-muted-foreground text-xs">
						{entry.author.login} · {where} · {getCaughtByLabel(entry.caughtBy)}{" "}
						· {formatRelativeTime(entry.at)}
					</p>
				</div>

				<div className="hidden shrink-0 items-center gap-3 md:flex">
					{statusTag ? (
						<LogTag dot={statusTag.dot} label={statusTag.label} />
					) : null}
					<LogTag dot={action.dot} label={action.label} />
				</div>
			</div>
		</div>
	);
});
