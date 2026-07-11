import {
	Cancel01Icon,
	LinkSquare01Icon,
	Message01Icon,
	ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSidePanel } from "#/components/layouts/dashboard-side-panel";
import { ModerationConfirmActions } from "#/components/moderation/moderation-confirm-actions";
import { ReasonPill } from "#/components/moderation/reason-pill";
import { SeverityBadge } from "#/components/moderation/severity-badge";
import { Separator } from "#/components/ui/separator";
import { formatRelativeTime } from "#/lib/format-relative-time";
import { getItemTypeConfig } from "#/lib/item-type";
import type { FlaggedItem } from "#/lib/moderation.types";

export function ModerationDetail({ item }: { item: FlaggedItem }) {
	const { close } = useSidePanel();
	const { icon: TypeIcon, label: typeLabel } = getItemTypeConfig(item.type);
	const url = `https://github.com/${item.repository.fullName}/issues/${item.number}`;

	return (
		<div className="flex w-full flex-col overflow-hidden md:h-full md:w-80 md:rounded-xl md:border md:bg-card">
			<header className="flex items-center justify-between gap-2 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<TypeIcon
						size={15}
						strokeWidth={2}
						className="shrink-0 text-muted-foreground"
					/>
					<span className="truncate text-xs font-medium text-muted-foreground">
						{typeLabel} · #{item.number}
					</span>
				</div>
				<button
					type="button"
					onClick={close}
					aria-label="Close details"
					className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground"
				>
					<HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
				</button>
			</header>

			<Separator />

			<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-1.5">
						<ReasonPill reason={item.reason} />
						<SeverityBadge severity={item.severity} />
					</div>
					<h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						{item.repository.fullName}
						<HugeiconsIcon icon={LinkSquare01Icon} size={11} strokeWidth={2} />
					</a>
				</div>

				<div className="gap-2">
					<p className="text-xs leading-relaxed text-muted-foreground">
						Problematic content:
					</p>
					<p className="text-xs leading-relaxed rounded-lg p-3 bg-surface-1 text-muted-foreground">
						{item.bodyPreview}
					</p>
				</div>

				<dl className="flex flex-col gap-2.5 text-xs">
					<Field label="Author">
						<span className="flex items-center gap-1.5">
							<img
								src={item.author.avatarUrl}
								alt={item.author.login}
								className="size-4 rounded-full border border-border bg-surface-2"
							/>
							<span className="font-medium text-foreground">
								{item.author.login}
							</span>
						</span>
					</Field>
					<Field label="Reported by">
						{item.reporter ? (
							<span className="flex items-center gap-1.5">
								<img
									src={item.reporter.avatarUrl}
									alt={item.reporter.login}
									className="size-4 rounded-full border border-border bg-surface-2"
								/>
								<span className="font-medium text-foreground">
									{item.reporter.login}
								</span>
							</span>
						) : (
							<span className="font-mono text-foreground">
								automod · {item.automodRule}
							</span>
						)}
					</Field>
					<Field label="Reported">
						<span className="text-foreground">
							{formatRelativeTime(item.reportedAt)}
						</span>
					</Field>
					<Field label="Activity">
						<span className="flex items-center gap-3 text-foreground">
							<span className="flex items-center gap-1 tabular-nums">
								<HugeiconsIcon icon={Message01Icon} size={12} strokeWidth={2} />
								{item.comments}
							</span>
							<span className="flex items-center gap-1 tabular-nums">
								<HugeiconsIcon icon={ThumbsUpIcon} size={12} strokeWidth={2} />
								{item.reactions}
							</span>
						</span>
					</Field>
				</dl>
			</div>

			<Separator />

			<footer className="p-3">
				<ModerationConfirmActions item={item} />
			</footer>
		</div>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<dt className="text-muted-foreground">{label}</dt>
			<dd>{children}</dd>
		</div>
	);
}
