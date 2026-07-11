import type { CheckOrReview, ThreadStatus } from "#/lib/repo-analytics.types";

/** Status dot + label — restrained, like the moderation severity badge. */
export const THREAD_STATUS: Record<
	ThreadStatus,
	{ label: string; dot: string }
> = {
	open: { label: "Open", dot: "bg-emerald-500" },
	closed: { label: "Closed", dot: "bg-muted-foreground" },
	merged: { label: "Merged", dot: "bg-violet-500" },
};

export const CHECK_DOT: Record<CheckOrReview["status"], string> = {
	Approved: "bg-emerald-500",
	Passed: "bg-emerald-500",
	Changes: "bg-amber-500",
	Failed: "bg-red-500",
};
