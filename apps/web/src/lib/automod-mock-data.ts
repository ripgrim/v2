import type { AutomodRule, AutomodStats } from "#/lib/automod.types";
import type { ModStat } from "#/lib/moderation.types";

const avatar = (login: string) => `https://github.com/${login}.png`;

type SeedMatch = {
	id: string;
	type: AutomodRule["recentMatches"][number]["type"];
	repoFullName: string;
	number: number;
	authorLogin: string;
	snippet: string;
	minutesAgo: number;
	threadKind: "issue" | "pull";
	commentId: string;
};

type SeedRule = Omit<AutomodRule, "lastFiredAt" | "recentMatches"> & {
	lastFiredMinutesAgo: number;
	matches: SeedMatch[];
};

// Rules mirror the automod attributions seen in the moderation queue
// (blocklist/spam-domains, ci/workflow-tampering, …) so the two pages tell
// one coherent story. Each recent match points at a real thread comment in the
// active repo so it can be opened and highlighted in context.
const SEED: SeedRule[] = [
	{
		id: "rule_blocklist_spam_domains",
		name: "Known spam domains",
		description:
			"Blocks comments and issue bodies containing links to domains on the community spam blocklist.",
		category: "blocklist",
		pattern: "blocklist/spam-domains",
		scope: ["issue", "comment"],
		action: "hide",
		enabled: true,
		matches24h: 41,
		matches30d: 1180,
		falsePositiveRate: 1.4,
		lastFiredMinutesAgo: 6,
		trend: [22, 30, 18, 27, 35, 44, 41],
		matches: [
			{
				id: "m_01",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 97,
				threadKind: "issue",
				commentId: "97-1",
				authorLogin: "airdrop_king",
				snippet:
					"🚀 FREE $SOL airdrop, claim now 👉 sol-claim.xyz before it ends!!",
				minutesAgo: 6,
			},
			{
				id: "m_02",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 75,
				threadKind: "issue",
				commentId: "75-2",
				authorLogin: "giveaway_bot7",
				snippet: "elon airdrop live now, connect wallet at eth-2x.app",
				minutesAgo: 51,
			},
		],
	},
	{
		id: "rule_ci_workflow_tampering",
		name: "Workflow tampering",
		description:
			"Flags pull requests that modify CI workflow files alongside large vendored or minified changes.",
		category: "heuristic",
		pattern: "ci/workflow-tampering",
		scope: ["pull"],
		action: "require-review",
		enabled: true,
		matches24h: 3,
		matches30d: 64,
		falsePositiveRate: 8.6,
		lastFiredMinutesAgo: 26,
		trend: [1, 0, 2, 1, 4, 2, 3],
		matches: [
			{
				id: "m_03",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 314,
				threadKind: "pull",
				commentId: "314-9",
				authorLogin: "new_user_44",
				snippet: "off-topic promo, please check my profile",
				minutesAgo: 26,
			},
		],
	},
	{
		id: "rule_new_account_burst",
		name: "New-account burst",
		description:
			"Detects accounts created in the last hour posting identical content across multiple threads.",
		category: "heuristic",
		pattern: "heuristics/new-account-burst",
		scope: ["issue", "comment"],
		action: "flag",
		enabled: true,
		matches24h: 17,
		matches30d: 392,
		falsePositiveRate: 11.2,
		lastFiredMinutesAgo: 96,
		trend: [9, 14, 11, 8, 20, 15, 17],
		matches: [
			{
				id: "m_04",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 97,
				threadKind: "issue",
				commentId: "97-2",
				authorLogin: "new_user_44",
				snippet: "join our pump group, 100x guaranteed, dm me",
				minutesAgo: 96,
			},
		],
	},
	{
		id: "rule_profanity",
		name: "Profanity classifier",
		description:
			"Machine-learning classifier that scores message toxicity and profanity above a 0.9 threshold.",
		category: "classifier",
		pattern: "classifier/profanity",
		scope: ["issue", "pull", "comment"],
		action: "flag",
		enabled: true,
		matches24h: 28,
		matches30d: 710,
		falsePositiveRate: 14.8,
		lastFiredMinutesAgo: 42,
		trend: [31, 25, 29, 22, 26, 30, 28],
		matches: [
			{
				id: "m_05",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 88,
				threadKind: "issue",
				commentId: "88-2",
				authorLogin: "throwaway92",
				snippet: "nobody cares about your buggy app, learn to code",
				minutesAgo: 42,
			},
			{
				id: "m_06",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 312,
				threadKind: "pull",
				commentId: "312-2",
				authorLogin: "rage_dev",
				snippet: "this is trash, why did it take you a week",
				minutesAgo: 240,
			},
		],
	},
	{
		id: "rule_harassment_classifier",
		name: "Harassment & threats",
		description:
			"Classifier tuned for targeted harassment, doxxing, and threats directed at maintainers.",
		category: "classifier",
		pattern: "classifier/harassment",
		scope: ["issue", "comment"],
		action: "hide",
		enabled: true,
		matches24h: 5,
		matches30d: 118,
		falsePositiveRate: 6.1,
		lastFiredMinutesAgo: 38,
		trend: [3, 2, 4, 6, 3, 5, 5],
		matches: [
			{
				id: "m_07",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 88,
				threadKind: "issue",
				commentId: "88-2",
				authorLogin: "throwaway92",
				snippet: "nobody cares about your buggy app, learn to code",
				minutesAgo: 38,
			},
		],
	},
	{
		id: "rule_crypto_promo",
		name: "Crypto & airdrop promos",
		description:
			"Regex matching common crypto-promotion phrasing (airdrops, gift cards, follower farming).",
		category: "regex",
		pattern: "\\b(airdrop|free \\$?\\d+|10k followers|gift ?cards?)\\b",
		scope: ["issue", "comment"],
		action: "hide",
		enabled: true,
		matches24h: 33,
		matches30d: 905,
		falsePositiveRate: 3.2,
		lastFiredMinutesAgo: 4,
		trend: [28, 31, 26, 35, 40, 38, 33],
		matches: [
			{
				id: "m_08",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 75,
				threadKind: "issue",
				commentId: "75-1",
				authorLogin: "0xclaim",
				snippet:
					"send 0.1 ETH to 0x9f…1a2b and receive 1 ETH back, official giveaway",
				minutesAgo: 4,
			},
		],
	},
	{
		id: "rule_tracking_pixel",
		name: "Tracking pixels in docs",
		description:
			"Regex flagging external <img> beacons added to README or documentation pages.",
		category: "regex",
		pattern: '<img[^>]+src="https?://(?!github)',
		scope: ["pull"],
		action: "require-review",
		enabled: true,
		matches24h: 1,
		matches30d: 12,
		falsePositiveRate: 22.5,
		lastFiredMinutesAgo: 540,
		trend: [0, 1, 0, 2, 0, 1, 1],
		matches: [
			{
				id: "m_09",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 314,
				threadKind: "pull",
				commentId: "314-9",
				authorLogin: "new_user_44",
				snippet: "off-topic promo, please check my profile",
				minutesAgo: 540,
			},
		],
	},
	{
		id: "rule_low_effort_plus_one",
		name: "Low-effort +1 noise",
		description:
			"Heuristic collapsing repetitive '+1' / 'me too' comments posted in rapid succession.",
		category: "heuristic",
		pattern: "heuristics/plus-one-burst",
		scope: ["comment"],
		action: "flag",
		enabled: false,
		matches24h: 0,
		matches30d: 240,
		falsePositiveRate: 19.4,
		lastFiredMinutesAgo: 74,
		trend: [12, 9, 14, 0, 0, 0, 0],
		matches: [
			{
				id: "m_10",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 91,
				threadKind: "issue",
				commentId: "91-9",
				authorLogin: "new_user_44",
				snippet: "off-topic promo, please check my profile",
				minutesAgo: 74,
			},
		],
	},
	{
		id: "rule_nsfw_image",
		name: "NSFW image links",
		description:
			"Classifier scanning linked images for explicit content and promotional adult material.",
		category: "classifier",
		pattern: "classifier/nsfw-media",
		scope: ["issue", "comment"],
		action: "hide",
		enabled: true,
		matches24h: 4,
		matches30d: 96,
		falsePositiveRate: 2.0,
		lastFiredMinutesAgo: 52,
		trend: [2, 5, 3, 4, 6, 3, 4],
		matches: [
			{
				id: "m_11",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 97,
				threadKind: "issue",
				commentId: "97-4",
				authorLogin: "burner4821",
				snippet: "cheap followers + crypto, link in bio",
				minutesAgo: 52,
			},
		],
	},
	{
		id: "rule_mass_delete",
		name: "Destructive PR guard",
		description:
			"Heuristic flagging pull requests that delete large numbers of test files or disable CI jobs.",
		category: "heuristic",
		pattern: "heuristics/mass-deletion",
		scope: ["pull"],
		action: "require-review",
		enabled: true,
		matches24h: 2,
		matches30d: 38,
		falsePositiveRate: 12.9,
		lastFiredMinutesAgo: 130,
		trend: [1, 1, 0, 3, 2, 1, 2],
		matches: [
			{
				id: "m_12",
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 312,
				threadKind: "pull",
				commentId: "312-2",
				authorLogin: "rage_dev",
				snippet: "this is trash, why did it take you a week",
				minutesAgo: 130,
			},
		],
	},
];

export function seedAutomodRules(now: number): AutomodRule[] {
	return SEED.map(({ lastFiredMinutesAgo, matches, ...rule }) => ({
		...rule,
		lastFiredAt: new Date(now - lastFiredMinutesAgo * 60_000).toISOString(),
		recentMatches: matches.map(({ minutesAgo, authorLogin, ...match }) => ({
			...match,
			author: { login: authorLogin, avatarUrl: avatar(authorLogin) },
			matchedAt: new Date(now - minutesAgo * 60_000).toISOString(),
			verdict: "pending" as const,
		})),
	}));
}

export function seedAutomodStats(): AutomodStats {
	const stat = (value: number, delta: number, series: number[]): ModStat => ({
		value,
		delta,
		series,
	});
	return {
		activeRules: stat(9, 2, [6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 8, 9, 9, 9, 9]),
		matches24h: stat(
			126,
			-8,
			[14, 18, 12, 22, 26, 19, 28, 21, 16, 24, 18, 13, 20, 15, 11, 12],
		),
		falsePositiveRate: stat(
			7.4,
			-1.3,
			[11, 10, 12, 9, 10, 8, 9, 8, 7, 9, 8, 7, 8, 7, 6, 7],
		),
		autoActioned24h: stat(
			88,
			14,
			[3, 6, 5, 9, 12, 10, 16, 14, 22, 19, 28, 24, 31, 27, 34, 30],
		),
	};
}
