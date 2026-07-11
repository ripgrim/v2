import { memo } from "react";
import { useSidePanel } from "#/components/layouts/dashboard-side-panel";
import { ModerationDetail } from "#/components/moderation/moderation-detail";
import { ReasonPill } from "#/components/moderation/reason-pill";
import { SeverityBadge } from "#/components/moderation/severity-badge";
import { formatRelativeTime } from "#/lib/format-relative-time";
import { getItemTypeConfig } from "#/lib/item-type";
import type { FlaggedItem } from "#/lib/moderation.types";
import { cn } from "#/lib/utils";

export const QueueItemRow = memo(function QueueItemRow({
	item,
}: {
	item: FlaggedItem;
}) {
	const { activeKey, open, close } = useSidePanel();
	const { icon: TypeIcon, label: typeLabel } = getItemTypeConfig(item.type);
	const isActive = activeKey === item.id;

	return (
		<div className={cn("group relative rounded-lg", isActive && "bg-muted")}>
			{/* Overlay button owns the row click + keyboard focus so the action
			    toolbar can sit above it without nesting interactive elements. */}
			<button
				type="button"
				aria-pressed={isActive}
				aria-label={isActive ? `Close ${item.title}` : `Open ${item.title}`}
				onClick={() =>
					isActive ? close() : open(item.id, <ModerationDetail item={item} />)
				}
				className="absolute inset-0 z-0 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 group-hover:bg-muted"
			/>

			<div className="pointer-events-none relative z-10 flex items-center gap-3 px-3 py-2.5">
				<TypeIcon
					size={15}
					strokeWidth={2}
					aria-label={typeLabel}
					className="mt-0.5 shrink-0 self-start text-muted-foreground"
				/>

				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<p className="truncate text-sm font-medium">{item.title}</p>
					<p className="truncate text-xs text-muted-foreground">
						{item.repository.fullName} #{item.number} ·{" "}
						{formatRelativeTime(item.reportedAt)}
					</p>
				</div>

				<div className="hidden shrink-0 items-center gap-2 md:flex">
					<ReasonPill reason={item.reason} />
					<SeverityBadge severity={item.severity} />
				</div>
			</div>
		</div>
	);
});
