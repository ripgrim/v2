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

type SeedEvent = Omit<AnalyticsEvent, "at"> & { minutesAgo: number };

/**
 * Activity seeds keyed by metric. Each chart tells its own story — clicking a
 * different metric surfaces the events that actually moved that line, not a
 * shared org-wide feed.
 */
const SEEDS: Record<string, SeedEvent[]> = {
	// --- Moderation ---
	pending: [
		{
			id: "ev_pend_1",
			kind: "spike",
			title: "Report spike from new accounts",
			detail: "23 reports in 12 min — spam links across 4 repos",
			minutesAgo: 30,
			impact: { label: "+18 reports", tone: "up" },
		},
		{
			id: "ev_pend_2",
			kind: "report",
			title: "Harassment wave in withastro/astro",
			detail: "Doxxing attempt flagged by 3 maintainers",
			minutesAgo: 145,
			impact: { label: "critical", tone: "up" },
		},
		{
			id: "ev_pend_3",
			kind: "resolve",
			title: "Bulk-resolved 30 reports",
			detail: "Automod-confirmed spam cleared by @stylessh",
			minutesAgo: 320,
			impact: { label: "−30 pending", tone: "down" },
		},
		{
			id: "ev_pend_4",
			kind: "ban",
			title: "Banned 3 repeat offenders",
			detail: "Linked to the crypto-airdrop spam ring",
			minutesAgo: 540,
			impact: { label: "−9 pending", tone: "down" },
		},
		{
			id: "ev_pend_5",
			kind: "drop",
			title: "Off-topic noise subsided",
			detail: "Rate-limit cooled a +1 spam burst",
			minutesAgo: 820,
			impact: { label: "−12 noise", tone: "down" },
		},
		{
			id: "ev_pend_6",
			kind: "deploy",
			title: "Blocklist updated",
			detail: "Added 14 spam domains to the org blocklist",
			minutesAgo: 1180,
		},
	],
	resolved: [
		{
			id: "ev_res_1",
			kind: "resolve",
			title: "Cleared the overnight backlog",
			detail: "@stylessh worked 42 reports before standup",
			minutesAgo: 25,
			impact: { label: "+42 resolved", tone: "down" },
		},
		{
			id: "ev_res_2",
			kind: "spike",
			title: "Triage sprint after the incident call",
			detail: "4 mods cleared the harassment queue together",
			minutesAgo: 160,
			impact: { label: "+28 resolved", tone: "down" },
		},
		{
			id: "ev_res_3",
			kind: "deploy",
			title: "Saved-reply macros added",
			detail: "One-click resolve for known spam templates",
			minutesAgo: 360,
		},
		{
			id: "ev_res_4",
			kind: "resolve",
			title: "Auto-confirmed spam swept",
			detail: "126 automod hits closed without review",
			minutesAgo: 600,
			impact: { label: "+126 closed", tone: "down" },
		},
		{
			id: "ev_res_5",
			kind: "drop",
			title: "Resolution rate dipped overnight",
			detail: "Only the on-call mod was active 2–6am",
			minutesAgo: 980,
			impact: { label: "−61% throughput", tone: "up" },
		},
		{
			id: "ev_res_6",
			kind: "report",
			title: "Reopened a wrongful removal",
			detail: "Appeal upheld for rust-lang/rust #91022",
			minutesAgo: 1300,
		},
	],
	automod: [
		{
			id: "ev_amh_1",
			kind: "spike",
			title: "New-account burst rule fired 17×",
			detail: "Coordinated comment spam in drizzle-orm",
			minutesAgo: 40,
			impact: { label: "+17 hits", tone: "up" },
		},
		{
			id: "ev_amh_2",
			kind: "rule",
			title: "Tracking-pixel guard shipped",
			detail: "Flags external <img> beacons in docs PRs",
			minutesAgo: 220,
		},
		{
			id: "ev_amh_3",
			kind: "ban",
			title: "Auto-hid 12 comments",
			detail: "classifier/nsfw-media over 0.9 confidence",
			minutesAgo: 430,
			impact: { label: "+12 actioned", tone: "up" },
		},
		{
			id: "ev_amh_4",
			kind: "deploy",
			title: "Profanity classifier v2",
			detail: "Recall up — more borderline comments caught",
			minutesAgo: 700,
			impact: { label: "+9% recall", tone: "up" },
		},
		{
			id: "ev_amh_5",
			kind: "drop",
			title: "Tuned blocklist thresholds",
			detail: "Hit volume normalized after the spam wave",
			minutesAgo: 1020,
			impact: { label: "−31 hits", tone: "down" },
		},
		{
			id: "ev_amh_6",
			kind: "report",
			title: "Maintainer disputed a flag",
			detail: "False positive on a legitimate release note",
			minutesAgo: 1280,
		},
	],
	banned: [
		{
			id: "ev_ban_1",
			kind: "ban",
			title: "Banned the crypto-airdrop ring",
			detail: "5 accounts sharing one device fingerprint",
			minutesAgo: 55,
			impact: { label: "+5 banned", tone: "up" },
		},
		{
			id: "ev_ban_2",
			kind: "ban",
			title: "Repeat offender hardware-banned",
			detail: "Evaded 3 prior bans in solidjs/solid",
			minutesAgo: 230,
			impact: { label: "+1 banned", tone: "up" },
		},
		{
			id: "ev_ban_3",
			kind: "report",
			title: "Ban appeal received",
			detail: "@drive-by-dev requests review of a 7-day ban",
			minutesAgo: 410,
		},
		{
			id: "ev_ban_4",
			kind: "spike",
			title: "Brigade from a Discord raid",
			detail: "9 accounts banned in one sweep",
			minutesAgo: 690,
			impact: { label: "+9 banned", tone: "up" },
		},
		{
			id: "ev_ban_5",
			kind: "deploy",
			title: "Ban-evasion detector enabled",
			detail: "Matches device + ASN across new signups",
			minutesAgo: 1010,
		},
		{
			id: "ev_ban_6",
			kind: "drop",
			title: "Two bans lifted on appeal",
			detail: "Mistaken identity in a nodejs/node thread",
			minutesAgo: 1290,
			impact: { label: "−2 banned", tone: "down" },
		},
	],
	// --- Automod ---
	rules: [
		{
			id: "ev_rul_1",
			kind: "rule",
			title: "New rule: tracking-pixel guard",
			detail: "Flags external <img> beacons in docs PRs",
			minutesAgo: 45,
			impact: { label: "+1 rule", tone: "neutral" },
		},
		{
			id: "ev_rul_2",
			kind: "rule",
			title: "Disabled 'Low-effort +1 noise'",
			detail: "19.4% FP rate too high for auto-flag",
			minutesAgo: 200,
			impact: { label: "−1 rule", tone: "neutral" },
		},
		{
			id: "ev_rul_3",
			kind: "deploy",
			title: "Imported the OSS-spam rule pack",
			detail: "6 community rules added in shadow mode",
			minutesAgo: 420,
			impact: { label: "+6 shadowed", tone: "neutral" },
		},
		{
			id: "ev_rul_4",
			kind: "rule",
			title: "Enabled nsfw-media classifier",
			detail: "Out of shadow mode after a clean week",
			minutesAgo: 660,
		},
		{
			id: "ev_rul_5",
			kind: "rule",
			title: "Tightened new-account heuristics",
			detail: "Age threshold raised 24h → 72h",
			minutesAgo: 960,
		},
		{
			id: "ev_rul_6",
			kind: "drop",
			title: "Sunset 2 legacy regex rules",
			detail: "Superseded by the v2 classifier",
			minutesAgo: 1320,
			impact: { label: "−2 rules", tone: "neutral" },
		},
	],
	matches: [
		{
			id: "ev_mat_1",
			kind: "spike",
			title: "New-account burst rule fired 17×",
			detail: "Coordinated comment spam in drizzle-orm",
			minutesAgo: 50,
			impact: { label: "+17 matches", tone: "up" },
		},
		{
			id: "ev_mat_2",
			kind: "spike",
			title: "Link-shortener guard caught 23",
			detail: "bit.ly chains across 5 issue threads",
			minutesAgo: 190,
			impact: { label: "+23 matches", tone: "up" },
		},
		{
			id: "ev_mat_3",
			kind: "drop",
			title: "Matches fell after threshold tune",
			detail: "Confidence floor raised to 0.85",
			minutesAgo: 410,
			impact: { label: "−38 matches", tone: "down" },
		},
		{
			id: "ev_mat_4",
			kind: "deploy",
			title: "Classifier v2 in active mode",
			detail: "Wider net on borderline phrasing",
			minutesAgo: 650,
			impact: { label: "+12% volume", tone: "up" },
		},
		{
			id: "ev_mat_5",
			kind: "rule",
			title: "Shadow rule promoted",
			detail: "tracking-pixel guard now actioning",
			minutesAgo: 940,
		},
		{
			id: "ev_mat_6",
			kind: "drop",
			title: "Quiet overnight window",
			detail: "Only 4 matches between 2–6am",
			minutesAgo: 1300,
			impact: { label: "−91% volume", tone: "down" },
		},
	],
	fp: [
		{
			id: "ev_fp_1",
			kind: "deploy",
			title: "Profanity classifier v2 shipped",
			detail: "Recall up, precision dipped",
			minutesAgo: 45,
			impact: { label: "+6% FP", tone: "up" },
		},
		{
			id: "ev_fp_2",
			kind: "report",
			title: "Maintainer flagged a false positive",
			detail: "Release note caught as spam in vercel/next.js",
			minutesAgo: 175,
			impact: { label: "+0.4% FP", tone: "up" },
		},
		{
			id: "ev_fp_3",
			kind: "drop",
			title: "Tuned blocklist thresholds",
			detail: "spam-domain FP rate down to 1.4%",
			minutesAgo: 380,
			impact: { label: "−2.1% FP", tone: "down" },
		},
		{
			id: "ev_fp_4",
			kind: "rule",
			title: "Disabled 'Low-effort +1 noise'",
			detail: "19.4% FP rate too high for auto-flag",
			minutesAgo: 620,
			impact: { label: "−1.9% FP", tone: "down" },
		},
		{
			id: "ev_fp_5",
			kind: "deploy",
			title: "Allowlisted 8 trusted domains",
			detail: "Cut docs-link false positives",
			minutesAgo: 940,
			impact: { label: "−0.8% FP", tone: "down" },
		},
		{
			id: "ev_fp_6",
			kind: "spike",
			title: "Sarcasm tripped the toxicity model",
			detail: "Cluster of FPs in a heated RFC thread",
			minutesAgo: 1280,
			impact: { label: "+1.2% FP", tone: "up" },
		},
	],
	actioned: [
		{
			id: "ev_act_1",
			kind: "ban",
			title: "Swept 12 spam comments",
			detail: "Auto-hidden at >0.9 confidence",
			minutesAgo: 60,
			impact: { label: "+12 hidden", tone: "down" },
		},
		{
			id: "ev_act_2",
			kind: "spike",
			title: "Mass-hid a comment-spam wave",
			detail: "31 actions during the drizzle-orm raid",
			minutesAgo: 210,
			impact: { label: "+31 actioned", tone: "up" },
		},
		{
			id: "ev_act_3",
			kind: "resolve",
			title: "No human review needed",
			detail: "118 confirmed-spam actions auto-closed",
			minutesAgo: 430,
			impact: { label: "+118 closed", tone: "down" },
		},
		{
			id: "ev_act_4",
			kind: "deploy",
			title: "Auto-lock on repeat offenders",
			detail: "Threads locked after 3 hidden comments",
			minutesAgo: 700,
		},
		{
			id: "ev_act_5",
			kind: "drop",
			title: "Action volume normalized",
			detail: "Back to baseline after the raid",
			minutesAgo: 1000,
			impact: { label: "−27 actioned", tone: "down" },
		},
		{
			id: "ev_act_6",
			kind: "report",
			title: "One auto-action reversed",
			detail: "Restored a wrongly hidden answer",
			minutesAgo: 1310,
			impact: { label: "−1 actioned", tone: "up" },
		},
	],
};

const FALLBACK = "pending";

/** Events for a given metric, stamped to absolute timestamps off `now`. */
export function seedAnalyticsEvents(
	metric: string,
	now: number,
): AnalyticsEvent[] {
	const seed = SEEDS[metric] ?? SEEDS[FALLBACK];
	return seed.map(({ minutesAgo, ...event }) => ({
		...event,
		at: new Date(now - minutesAgo * 60_000).toISOString(),
	}));
}

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
