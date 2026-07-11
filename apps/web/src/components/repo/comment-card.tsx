import { EyeOff, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { AuthorLink } from "#/components/repo/author-link";
import { DitherGlow } from "#/components/repo/dither-glow";
import { formatRelativeTime } from "#/lib/format-relative-time";
import type { Comment } from "#/lib/repo-content.types";
import { cn } from "#/lib/utils";

/**
 * A single conversation comment. Flagged comments swap their body for a
 * moderation banner — automod hides, a moderator removes — with the original
 * text kept muted underneath so the context isn't lost. When `highlight` is set
 * (arrived here from an automod match, a log item, or a profile) the card
 * scrolls into view and a dithered glow leaks pixels around it.
 */
export function CommentCard({
	comment,
	org,
	repo,
	highlight = false,
}: {
	comment: Comment;
	org: string;
	repo: string;
	highlight?: boolean;
}) {
	const removed = comment.flag?.state === "Removed";
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (highlight) {
			ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [highlight]);

	return (
		<div ref={ref} className="flex scroll-mt-6 gap-3">
			<img
				src={`https://github.com/${comment.author}.png`}
				alt={comment.author}
				className="mt-0.5 size-7 shrink-0 rounded-full border border-border bg-surface-2"
			/>
			<div className="relative min-w-0 flex-1">
				{highlight ? <DitherGlow className="absolute inset-0" /> : null}
				<div
					className={cn(
						"overflow-hidden rounded-xl border",
						highlight ? "border-brand/25" : "border-border",
					)}
				>
					<div className="flex items-center gap-2 border-border border-b bg-surface-1 px-3.5 py-2">
						<AuthorLink
							org={org}
							repo={repo}
							login={comment.author}
							className="font-medium text-[13px] text-foreground hover:text-brand"
						/>
						<span className="text-[12px] text-muted-foreground">
							commented {formatRelativeTime(comment.createdAt)}
						</span>
					</div>

					{comment.flag ? (
						<div className="flex flex-col gap-2 px-3.5 py-3">
							<div
								className={cn(
									"flex items-center gap-2 font-medium text-[12px]",
									removed ? "text-red-400" : "text-amber-400",
								)}
							>
								{removed ? (
									<Trash2 size={13} strokeWidth={2} />
								) : (
									<EyeOff size={13} strokeWidth={2} />
								)}
								{removed ? "Removed" : "Hidden"} · {comment.flag.rule}
							</div>
							<p className="text-[13px] text-muted-foreground/70 line-through">
								{comment.body}
							</p>
						</div>
					) : (
						<p className="whitespace-pre-wrap px-3.5 py-3 text-[13px] text-foreground/90">
							{comment.body}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
