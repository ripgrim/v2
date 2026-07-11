import { GitBranch } from "lucide-react";
import { AuthorLink } from "#/components/repo/author-link";
import { CommentCard } from "#/components/repo/comment-card";
import { LabelPill } from "#/components/repo/label-pill";
import { threadVisual } from "#/components/repo/thread-visual";
import { formatRelativeTime } from "#/lib/format-relative-time";
import type { ThreadDetail } from "#/lib/repo-content.types";
import { cn } from "#/lib/utils";

/** The full issue/PR conversation: header, opening post, then comments. */
export function ThreadView({
	detail,
	org,
	repo,
	highlightId,
}: {
	detail: ThreadDetail;
	org: string;
	repo: string;
	highlightId?: string;
}) {
	const { Icon, pill, label } = threadVisual(detail.kind, detail.status);
	const kindWord = detail.kind === "issue" ? "issue" : "pull request";

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-col gap-3">
				<h1 className="font-semibold text-foreground text-xl tracking-tight">
					{detail.title}{" "}
					<span className="font-normal text-muted-foreground">
						#{detail.number}
					</span>
				</h1>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<span
						className={cn(
							"inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 font-medium text-[12px]",
							pill,
						)}
					>
						<Icon size={13} strokeWidth={2} />
						{label}
					</span>
					<span className="text-[13px] text-muted-foreground">
						<AuthorLink
							org={org}
							repo={repo}
							login={detail.author}
							className="font-medium text-foreground"
						/>{" "}
						opened this {kindWord} {formatRelativeTime(detail.openedAt)}
					</span>
					{detail.labels.map((l) => (
						<LabelPill key={l.name} label={l} />
					))}
				</div>
				{detail.branch ? (
					<div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
						<GitBranch size={13} strokeWidth={2} />
						<span className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-[11px] text-foreground/80">
							{detail.baseBranch}
						</span>
						<span>←</span>
						<span className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-[11px] text-foreground/80">
							{detail.branch}
						</span>
					</div>
				) : null}
			</header>

			<CommentCard
				comment={{
					id: "op",
					author: detail.author,
					body: detail.body,
					createdAt: detail.openedAt,
				}}
				org={org}
				repo={repo}
				highlight={highlightId === "op"}
			/>

			{detail.comments.length > 0 ? (
				<div className="flex flex-col gap-4">
					{detail.comments.map((c) => (
						<CommentCard
							key={c.id}
							comment={c}
							org={org}
							repo={repo}
							highlight={highlightId === c.id}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}
