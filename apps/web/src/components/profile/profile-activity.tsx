import {
	Ban,
	GitPullRequest,
	type LucideIcon,
	MessageSquare,
	ShieldAlert,
	Trash2,
	UserPlus,
} from "lucide-react";
import type {
	ContributorActivity,
	ContributorActivityKind,
} from "#/lib/contributor.types";
import { formatRelativeTime } from "#/lib/format-relative-time";

const ICONS: Record<ContributorActivityKind, LucideIcon> = {
	"automod-hidden": Ban,
	"pull-opened": GitPullRequest,
	"comment-removed": Trash2,
	"issue-comment": MessageSquare,
	flagged: ShieldAlert,
	"account-created": UserPlus,
};

export function ProfileActivity({ events }: { events: ContributorActivity[] }) {
	return (
		<section className="flex min-w-0 flex-1 flex-col gap-3">
			<div className="flex items-center gap-2 px-3">
				<h2 className="font-semibold text-foreground text-sm tracking-tight">
					Activity
				</h2>
				<span className="flex h-4.5 items-center rounded-full bg-surface-0 px-2 font-medium text-[11px] text-muted-foreground">
					{events.length}
				</span>
			</div>
			<div className="flex flex-col">
				{events.map((event) => (
					<ActivityRow key={event.id} event={event} />
				))}
			</div>
		</section>
	);
}

function ActivityRow({ event }: { event: ContributorActivity }) {
	const Icon = ICONS[event.kind];
	return (
		<div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-0">
			<span className="shrink-0 text-muted-foreground">
				<Icon size={15} strokeWidth={1.8} />
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="truncate font-medium text-foreground text-sm">
					{event.title}
				</span>
				<span className="truncate text-muted-foreground text-xs">
					{event.detail}
				</span>
			</div>
			<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
				{formatRelativeTime(event.at)}
			</span>
		</div>
	);
}
