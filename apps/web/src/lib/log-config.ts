import type { CaughtBy, LogAction, LogStatus } from "#/lib/log.types";

/** A label with a small colored dot — restrained, like the severity badge. */
type Tag = { label: string; dot: string };

const ACTION: Record<LogAction, Tag> = {
	removed: { label: "Removed", dot: "bg-red-500" },
	banned: { label: "Banned", dot: "bg-red-500" },
	hidden: { label: "Hidden", dot: "bg-amber-500" },
	"required-review": { label: "Review", dot: "bg-blue-500" },
	dismissed: { label: "Dismissed", dot: "bg-muted-foreground/40" },
};

export function getActionTag(action: LogAction): Tag {
	return ACTION[action];
}

const STATUS: Partial<Record<LogStatus, Tag>> = {
	appealed: { label: "Appealed", dot: "bg-amber-500" },
	reversed: { label: "Reversed", dot: "bg-emerald-500" },
};

/**
 * Status tag — null for "actioned"/"dismissed" since the action tag already
 * conveys those; only appeals and reversals add a distinct one.
 */
export function getStatusTag(status: LogStatus): Tag | null {
	return STATUS[status] ?? null;
}

export function getCaughtByLabel(caughtBy: CaughtBy): string {
	if (caughtBy.kind === "report") {
		return `reported by ${caughtBy.reporter?.login ?? "a user"}`;
	}
	if (caughtBy.kind === "manual") return "manual action";
	return `automod · ${caughtBy.detail}`;
}
