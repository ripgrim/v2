export type EventKind =
	| "spike"
	| "drop"
	| "rule"
	| "ban"
	| "deploy"
	| "resolve"
	| "report";

export type EventImpact = { label: string; tone: "up" | "down" | "neutral" };

export type AnalyticsEvent = {
	id: string;
	kind: EventKind;
	title: string;
	detail: string;
	at: string;
	impact?: EventImpact;
};

/** The event whose timestamp sits closest to `targetHoursAgo`. */
export function closestEventId(
	events: AnalyticsEvent[],
	targetHoursAgo: number,
	now: number,
): string | null {
	let bestId: string | null = null;
	let bestDiff = Number.POSITIVE_INFINITY;
	for (const event of events) {
		const ageH = (now - new Date(event.at).getTime()) / 3_600_000;
		const diff = Math.abs(ageH - targetHoursAgo);
		if (diff < bestDiff) {
			bestDiff = diff;
			bestId = event.id;
		}
	}
	return bestId;
}
