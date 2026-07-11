import {
	Cancel01Icon,
	LinkSquare01Icon,
	RotateLeft01Icon,
	Shield01Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSidePanel } from "#/components/layouts/dashboard-side-panel";
import { GlassContent } from "#/components/log/glass-content";
import { LogTag } from "#/components/log/log-tag";
import { ReasonPill } from "#/components/moderation/reason-pill";
import { SeverityBadge } from "#/components/moderation/severity-badge";
import { AuthorLink } from "#/components/repo/author-link";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { formatRelativeTime } from "#/lib/format-relative-time";
import { getItemTypeConfig } from "#/lib/item-type";
import { moderationLogQueryOptions } from "#/lib/log.query";
import { getActionTag, getCaughtByLabel, getStatusTag } from "#/lib/log-config";
import { useLogActions, VIEWER_IS_LEAD } from "#/lib/use-log-actions";
import { cn } from "#/lib/utils";

export function LogDetail({ entryId }: { entryId: string }) {
	const { close } = useSidePanel();
	const { undo, resolveBundle } = useLogActions();
	const logQuery = useQuery(moderationLogQueryOptions());
	const entry = logQuery.data?.find((e) => e.id === entryId);

	const [kept, setKept] = useState<Set<string>>(new Set());
	const [reasonOpen, setReasonOpen] = useState(false);
	const [reason, setReason] = useState("");

	if (!entry) return null;

	const [org, repo] = (entry.items[0]?.repoFullName ?? "/").split("/");
	const isBundle = entry.items.length > 1;
	const action = getActionTag(entry.action);
	const statusTag = getStatusTag(entry.status);
	const toggleKept = (id: string) =>
		setKept((set) => {
			const next = new Set(set);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	return (
		<div className="flex w-full flex-col overflow-hidden md:h-full md:w-80 md:rounded-xl md:border md:bg-card">
			<header className="flex items-center justify-between gap-2 px-4 py-3">
				<span className="truncate text-[11px] text-muted-foreground">
					Log entry
				</span>
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
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
						<LogTag dot={action.dot} label={action.label} />
						{statusTag ? (
							<LogTag dot={statusTag.dot} label={statusTag.label} />
						) : null}
						<ReasonPill reason={entry.reason} />
						<SeverityBadge severity={entry.severity} />
					</div>
					<h3 className="font-semibold text-sm leading-snug">{entry.label}</h3>
					<p className="text-muted-foreground text-xs">
						{getCaughtByLabel(entry.caughtBy)}
						{entry.snapshot ? " · copy saved" : ""}
					</p>
				</div>

				<dl className="flex flex-col gap-2.5 text-xs">
					<Field label="Author">
						<span className="flex items-center gap-1.5">
							<img
								src={entry.author.avatarUrl}
								alt={entry.author.login}
								className="size-4 rounded-full border border-border bg-surface-2"
							/>
							<AuthorLink
								org={org}
								repo={repo}
								login={entry.author.login}
								className="font-medium text-foreground"
							/>
						</span>
					</Field>
					{entry.moderator ? (
						<Field label="Moderator">
							<Person
								login={entry.moderator.login}
								src={entry.moderator.avatarUrl}
							/>
						</Field>
					) : null}
					<Field label="When">
						<span className="text-foreground">
							{formatRelativeTime(entry.at)}
						</span>
					</Field>
				</dl>

				<div className="flex flex-col gap-2">
					<p className="font-medium text-muted-foreground text-xs">
						{isBundle ? `Content · ${entry.items.length} items` : "Content"}
					</p>
					{entry.items.map((item) => {
						const { icon: TypeIcon } = getItemTypeConfig(item.type);
						const isKept = kept.has(item.id);
						return (
							<div
								key={item.id}
								className={cn(
									"flex flex-col gap-2 rounded-lg border bg-surface-0 p-2.5 transition-colors",
									isKept &&
										"border-emerald-500/40 bg-emerald-500/[0.06] opacity-90",
								)}
							>
								<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
									<TypeIcon size={12} strokeWidth={2} className="shrink-0" />
									<span className="flex-1 truncate">
										{item.repoFullName} #{item.number}
									</span>
									<Link
										to={
											item.threadKind === "issue"
												? "/$org/$repo/issues/$id"
												: "/$org/$repo/pulls/$id"
										}
										params={{ org, repo, id: String(item.number) }}
										search={{ c: item.commentId }}
										onClick={close}
										aria-label="Open in thread"
										className="flex shrink-0 items-center gap-1 text-muted-foreground transition-colors hover:text-brand"
									>
										view in thread
										<HugeiconsIcon
											icon={LinkSquare01Icon}
											size={11}
											strokeWidth={2}
										/>
									</Link>
									{isBundle ? (
										<button
											type="button"
											onClick={() => toggleKept(item.id)}
											className={cn(
												"ml-1 inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium text-[11px] transition-colors",
												isKept
													? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
													: "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground",
											)}
										>
											{isKept ? (
												<>
													<HugeiconsIcon
														icon={Tick01Icon}
														size={11}
														strokeWidth={2.5}
													/>
													Kept
												</>
											) : (
												"Spare"
											)}
										</button>
									) : null}
								</div>
								<GlassContent content={item.content} />
							</div>
						);
					})}
					{isBundle ? (
						<Button
							variant="outline"
							size="sm"
							className="text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
							onClick={() => resolveBundle(entry, kept)}
						>
							Remove {entry.items.length - kept.size} · spare {kept.size}
						</Button>
					) : null}
				</div>

				<div className="flex flex-col gap-1.5">
					<p className="font-medium text-muted-foreground text-xs">History</p>
					<ol className="flex flex-col gap-2 border-l pl-3">
						{entry.history.map((step) => (
							<li
								key={`${step.at}-${step.label}`}
								className="-ml-[14px] flex items-start gap-2"
							>
								<span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
								<div className="flex min-w-0 flex-col">
									<span className="text-foreground text-xs">{step.label}</span>
									<span className="text-[11px] text-muted-foreground">
										{step.by} · {formatRelativeTime(step.at)}
									</span>
								</div>
							</li>
						))}
					</ol>
				</div>
			</div>

			{VIEWER_IS_LEAD && entry.status !== "reversed" ? (
				<>
					<Separator />
					<footer className="flex flex-col gap-2.5 bg-surface-0 p-3">
						<div className="flex items-center justify-between gap-2">
							<span className="flex items-center gap-1.5 font-medium text-foreground text-xs">
								<HugeiconsIcon
									icon={Shield01Icon}
									size={13}
									strokeWidth={2}
									className="text-muted-foreground"
								/>
								Lead controls
							</span>
							{reasonOpen ? (
								<button
									type="button"
									onClick={() => setReasonOpen(false)}
									className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
								>
									Cancel
								</button>
							) : null}
						</div>

						{reasonOpen ? (
							<div className="flex flex-col gap-2">
								<textarea
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									placeholder="Reason for reversal — shared with the author"
									rows={2}
									className="w-full resize-none rounded-md border bg-card px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
								/>
								<Button
									variant="default"
									size="sm"
									className="w-full"
									disabled={!reason.trim()}
									iconLeft={
										<HugeiconsIcon
											icon={RotateLeft01Icon}
											size={13}
											strokeWidth={2.25}
										/>
									}
									onClick={() => {
										undo(entry, reason.trim());
										setReasonOpen(false);
										setReason("");
									}}
								>
									Confirm reverse
								</Button>
							</div>
						) : (
							<div className="flex items-center justify-between gap-2">
								<span className="text-[11px] text-muted-foreground">
									Restores the content · author is notified
								</span>
								<Button
									variant="outline"
									size="sm"
									iconLeft={
										<HugeiconsIcon
											icon={RotateLeft01Icon}
											size={13}
											strokeWidth={2.25}
										/>
									}
									onClick={() => setReasonOpen(true)}
								>
									Undo
								</Button>
							</div>
						)}
					</footer>
				</>
			) : null}
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

function Person({ login, src }: { login: string; src: string }) {
	return (
		<span className="flex items-center gap-1.5">
			<img
				src={src}
				alt={login}
				className="size-4 rounded-full border border-border bg-surface-2"
			/>
			<span className="font-medium text-foreground">{login}</span>
		</span>
	);
}
