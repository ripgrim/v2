import {
	CheckCircle2,
	CircleDot,
	GitMerge,
	GitPullRequest,
	type LucideIcon,
	XCircle,
} from "lucide-react";
import type { ThreadKind, ThreadStatus } from "#/lib/repo-analytics.types";

type Visual = {
	Icon: LucideIcon;
	/** Text color class for the bare icon (lists). */
	color: string;
	/** Pill bg + text classes for the status badge (detail header). */
	pill: string;
	label: string;
};

/** Maps an issue/PR's kind + status to its icon, color, and status pill. */
export function threadVisual(kind: ThreadKind, status: ThreadStatus): Visual {
	if (kind === "issue") {
		return status === "open"
			? {
					Icon: CircleDot,
					color: "text-emerald-500",
					pill: "bg-emerald-500/15 text-emerald-400",
					label: "Open",
				}
			: {
					Icon: CheckCircle2,
					color: "text-violet-500",
					pill: "bg-violet-500/15 text-violet-400",
					label: "Closed",
				};
	}
	if (status === "merged") {
		return {
			Icon: GitMerge,
			color: "text-violet-500",
			pill: "bg-violet-500/15 text-violet-400",
			label: "Merged",
		};
	}
	if (status === "closed") {
		return {
			Icon: XCircle,
			color: "text-red-500",
			pill: "bg-red-500/15 text-red-400",
			label: "Closed",
		};
	}
	return {
		Icon: GitPullRequest,
		color: "text-emerald-500",
		pill: "bg-emerald-500/15 text-emerald-400",
		label: "Open",
	};
}
