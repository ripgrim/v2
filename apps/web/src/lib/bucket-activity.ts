import type { ThreadKind } from "#/lib/repo-analytics.types";

/** A single comment behind a chart bucket — traceable to its root when linkable. */
export type BucketEvent = {
	id: string;
	author: string;
	snippet: string;
	/** The rule that caught it, or null if it passed automod. */
	automodHit: string | null;
	/** A real demo comment to highlight at its root, when this event maps to one. */
	link?: { threadKind: ThreadKind; threadNumber: number; commentId: string };
	/** A plausible thread to open without a highlight, for synthetic events. */
	softLink?: { threadKind: ThreadKind; threadNumber: number };
};

// Real demo flagged comments (exist in repo-content) so a share of events link
// to a highlightable root.
const REAL_FLAGGED = [
	{
		commentId: "97-1",
		kind: "issue",
		number: 97,
		author: "airdrop_king",
		rule: "Known spam domains",
		snippet:
			"🚀 FREE $SOL airdrop, claim now 👉 sol-claim.xyz before it ends!!",
	},
	{
		commentId: "75-1",
		kind: "issue",
		number: 75,
		author: "0xclaim",
		rule: "Crypto address guard",
		snippet:
			"send 0.1 ETH to 0x9f…1a2b and receive 1 ETH back, official giveaway",
	},
	{
		commentId: "75-2",
		kind: "issue",
		number: 75,
		author: "giveaway_bot7",
		rule: "Known spam domains",
		snippet: "elon airdrop live now, connect wallet at eth-2x.app",
	},
	{
		commentId: "88-2",
		kind: "issue",
		number: 88,
		author: "throwaway92",
		rule: "manual review",
		snippet: "nobody cares about your buggy app, learn to code",
	},
	{
		commentId: "312-2",
		kind: "pull",
		number: 312,
		author: "rage_dev",
		rule: "manual review",
		snippet: "this is trash, why did it take you a week",
	},
	{
		commentId: "91-9",
		kind: "issue",
		number: 91,
		author: "new_user_44",
		rule: "New-account burst",
		snippet: "off-topic promo, please check my profile",
	},
	{
		commentId: "314-9",
		kind: "pull",
		number: 314,
		author: "new_user_44",
		rule: "New-account burst",
		snippet: "off-topic promo, please check my profile",
	},
] as const;

const FLAGGED_AUTHORS = [
	"airdrop_king",
	"new_user_44",
	"burner4821",
	"throwaway92",
	"0xclaim",
	"giveaway_bot7",
];
const BENIGN_AUTHORS = [
	"priya-n",
	"mara-liang",
	"devon-okoro",
	"samir-h",
	"ghxst-dev",
	"kdev",
];
const RULES = [
	"Known spam domains",
	"New-account burst",
	"AI slop classifier",
	"Crypto address guard",
];
const SPAM_SNIPPETS = [
	"claim your free crypto, link in bio",
	"cheap followers fast, dm me",
	"join my telegram for 100x gains",
	"connect wallet to claim airdrop",
	"limited spots, get rich quick",
];
const BENIGN_SNIPPETS = [
	"reproduced on my machine, looking into it",
	"thanks, opened a PR for this",
	"can we add a test for the edge case?",
	"approving — clean change",
	"left a couple of small comments",
	"bumping, still hitting this on main",
];

function hashSeed(seed: string) {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
	}
	return h & 0x7fffffff;
}

/**
 * Deterministically expands a chart bucket into `count` comment-events seeded by
 * `(metricKey, bucketIndex)`. Flagged events lean on real demo comments so they
 * trace to a highlighted root; the rest are synthetic with soft links.
 */
export function seedBucketActivity(
	metricKey: string,
	bucketIndex: number,
	count: number,
): BucketEvent[] {
	let h = hashSeed(`${metricKey}#${bucketIndex}`);
	const next = () => (h = (Math.imul(h, 48271) + 1) & 0x7fffffff);
	const pick = <T>(arr: readonly T[]): T => arr[next() % arr.length];
	const chance = (p: number) => next() % 1000 < p * 1000;

	const flagBias = /block|automod|spam/.test(metricKey) ? 0.62 : 0.24;
	const events: BucketEvent[] = [];

	for (let i = 0; i < count; i++) {
		const id = `${metricKey}:${bucketIndex}:${i}`;
		const flagged = chance(flagBias);

		if (flagged && chance(0.5)) {
			const r = pick(REAL_FLAGGED);
			events.push({
				id,
				author: r.author,
				snippet: r.snippet,
				automodHit: r.rule,
				link: {
					threadKind: r.kind,
					threadNumber: r.number,
					commentId: r.commentId,
				},
			});
		} else if (flagged) {
			events.push({
				id,
				author: pick(FLAGGED_AUTHORS),
				snippet: pick(SPAM_SNIPPETS),
				automodHit: pick(RULES),
				softLink: {
					threadKind: chance(0.5) ? "issue" : "pull",
					threadNumber: 80 + (next() % 240),
				},
			});
		} else {
			events.push({
				id,
				author: pick(BENIGN_AUTHORS),
				snippet: pick(BENIGN_SNIPPETS),
				automodHit: null,
				softLink: chance(0.5)
					? { threadKind: "issue", threadNumber: 80 + (next() % 240) }
					: undefined,
			});
		}
	}
	return events;
}
