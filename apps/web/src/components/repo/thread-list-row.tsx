import { Link } from "@tanstack/react-router";
import { MessageSquare, ShieldAlert } from "lucide-react";
import { LabelPill } from "#/components/repo/label-pill";
import { threadVisual } from "#/components/repo/thread-visual";
import { formatRelativeTime } from "#/lib/format-relative-time";
import type { ThreadSummary } from "#/lib/repo-content.types";
import { cn } from "#/lib/utils";

/** One row in an issues or pulls list — links to the matching detail route. */
export function ThreadListRow({
	org,
	repo,
	thread,
}: {
	org: string;
	repo: string;
	thread: ThreadSummary;
}) {
	const { Icon, color } = threadVisual(thread.kind, thread.status);
	const params = { org, repo, id: String(thread.number) };

	const inner = (
		<>
			<Icon
				size={16}
				strokeWidth={2}
				className={cn("mt-0.5 shrink-0", color)}
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-medium text-[13px] text-foreground">
						{thread.title}
					</span>
					{thread.labels.map((label) => (
						<LabelPill key={label.name} label={label} />
					))}
				</div>
				<span className="text-[12px] text-muted-foreground">
					#{thread.number} opened {formatRelativeTime(thread.openedAt)} by{" "}
					{thread.author}
				</span>
			</div>
			<div className="flex shrink-0 items-center gap-3 pt-0.5">
				{thread.flagged > 0 ? (
					<span className="flex items-center gap-1 text-[12px] text-red-400 tabular-nums">
						<ShieldAlert size={13} strokeWidth={2} />
						{thread.flagged}
					</span>
				) : null}
				{thread.comments > 0 ? (
					<span className="flex items-center gap-1 text-[12px] text-muted-foreground tabular-nums">
						<MessageSquare size={13} strokeWidth={2} />
						{thread.comments}
					</span>
				) : null}
			</div>
		</>
	);

	const className =
		"group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2";

	if (thread.kind === "issue") {
		return (
			<Link to="/$org/$repo/issues/$id" params={params} className={className}>
				{inner}
			</Link>
		);
	}
	return (
		<Link to="/$org/$repo/pulls/$id" params={params} className={className}>
			{inner}
		</Link>
	);
}
