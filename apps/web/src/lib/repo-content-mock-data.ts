import type {
	Comment,
	Label,
	RepoContent,
	RepoSummary,
	ThreadDetail,
	ThreadSummary,
} from "#/lib/repo-content.types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

// Label presets — lowercase names, restrained tints (no caps, no tracking).
const LBL: Record<string, Label> = {
	bug: { name: "bug", className: "bg-red-500/12 text-red-400" },
	enhancement: {
		name: "enhancement",
		className: "bg-blue-500/12 text-blue-400",
	},
	design: { name: "design", className: "bg-violet-500/12 text-violet-400" },
	docs: {
		name: "documentation",
		className: "bg-emerald-500/12 text-emerald-400",
	},
	triage: { name: "needs triage", className: "bg-amber-500/12 text-amber-400" },
	good: {
		name: "good first issue",
		className: "bg-emerald-500/12 text-emerald-400",
	},
	spam: { name: "spam", className: "bg-red-500/12 text-red-400" },
};

const ISSUES: ThreadSummary[] = [
	{
		kind: "issue",
		number: 91,
		title: "Crash on iOS 17 when opening settings",
		status: "open",
		author: "kdev",
		openedAt: ago(6 * HOUR),
		comments: 19,
		flagged: 2,
		labels: [LBL.bug, LBL.triage],
	},
	{
		kind: "issue",
		number: 97,
		title: "Spam wave in discussions overnight",
		status: "open",
		author: "devon-okoro",
		openedAt: ago(14 * HOUR),
		comments: 23,
		flagged: 9,
		labels: [LBL.triage, LBL.spam],
	},
	{
		kind: "issue",
		number: 104,
		title: "Add keyboard shortcuts for triage actions",
		status: "open",
		author: "mara-liang",
		openedAt: ago(2 * DAY),
		comments: 7,
		flagged: 0,
		labels: [LBL.enhancement],
	},
	{
		kind: "issue",
		number: 110,
		title: "Docs: clarify webhook setup for self-hosting",
		status: "open",
		author: "priya-n",
		openedAt: ago(3 * DAY),
		comments: 3,
		flagged: 0,
		labels: [LBL.docs, LBL.good],
	},
	{
		kind: "issue",
		number: 88,
		title: "Login button misaligned on mobile",
		status: "closed",
		author: "samir-h",
		openedAt: ago(9 * DAY),
		comments: 42,
		flagged: 3,
		labels: [LBL.bug, LBL.design],
	},
	{
		kind: "issue",
		number: 83,
		title: "Dark mode flickers on first load",
		status: "closed",
		author: "ghxst-dev",
		openedAt: ago(12 * DAY),
		comments: 11,
		flagged: 1,
		labels: [LBL.bug],
	},
	{
		kind: "issue",
		number: 75,
		title: "Crypto promo spam from brand-new accounts",
		status: "closed",
		author: "burner4821",
		openedAt: ago(16 * DAY),
		comments: 14,
		flagged: 11,
		labels: [LBL.spam, LBL.triage],
	},
];

const PULLS: ThreadSummary[] = [
	{
		kind: "pull",
		number: 318,
		title: "Spam classifier: add crypto address guard",
		status: "open",
		author: "devon-okoro",
		openedAt: ago(5 * HOUR),
		comments: 12,
		flagged: 0,
		labels: [LBL.enhancement],
	},
	{
		kind: "pull",
		number: 320,
		title: "Fix login button alignment on small screens",
		status: "open",
		author: "samir-h",
		openedAt: ago(1 * DAY),
		comments: 4,
		flagged: 0,
		labels: [LBL.bug, LBL.design],
	},
	{
		kind: "pull",
		number: 312,
		title: "Add dark-mode toggle",
		status: "merged",
		author: "priya-n",
		openedAt: ago(2 * DAY),
		comments: 28,
		flagged: 1,
		labels: [LBL.design],
	},
	{
		kind: "pull",
		number: 314,
		title: "Add per-repo analytics",
		status: "merged",
		author: "ripgrim",
		openedAt: ago(4 * DAY),
		comments: 17,
		flagged: 2,
		labels: [LBL.enhancement],
	},
	{
		kind: "pull",
		number: 309,
		title: "Bump dependencies",
		status: "merged",
		author: "ghxst-dev",
		openedAt: ago(6 * DAY),
		comments: 9,
		flagged: 0,
		labels: [],
	},
	{
		kind: "pull",
		number: 305,
		title: "Refactor the queue store",
		status: "closed",
		author: "mara-liang",
		openedAt: ago(10 * DAY),
		comments: 6,
		flagged: 0,
		labels: [],
	},
];

type Convo = { body: string; comments: Comment[] };

const say = (
	number: number,
	i: number,
	author: string,
	body: string,
	ms: number,
): Comment => ({ id: `${number}-${i}`, author, body, createdAt: ago(ms) });

const flagged = (
	number: number,
	i: number,
	author: string,
	body: string,
	state: "Hidden" | "Removed",
	rule: string,
	ms: number,
): Comment => ({
	id: `${number}-${i}`,
	author,
	body,
	createdAt: ago(ms),
	flag: { state, rule },
});

// Bespoke conversations for the threads worth reading — the flagged ones show
// how automod's hides/removals surface inline.
const CONVO: Record<string, Convo> = {
	"issue-97": {
		body: "Around 2am a burst of identical promo comments hit three open discussions. They all link the same shortener and came from accounts created in the last hour. Filing so we can tune the new-account rule.",
		comments: [
			flagged(
				97,
				1,
				"airdrop_king",
				"🚀 FREE $SOL airdrop, claim now 👉 sol-claim.xyz before it ends!!",
				"Hidden",
				"Known spam domains",
				13 * HOUR,
			),
			flagged(
				97,
				2,
				"new_user_44",
				"join our pump group, 100x guaranteed, dm me",
				"Hidden",
				"New-account burst",
				13 * HOUR,
			),
			say(
				97,
				3,
				"devon-okoro",
				"Automod caught most of these within seconds — leaving this open to bump the burst threshold from 5 to 3.",
				12 * HOUR,
			),
			flagged(
				97,
				4,
				"burner4821",
				"cheap followers + crypto, link in bio",
				"Removed",
				"manual · removed by you",
				11 * HOUR,
			),
		],
	},
	"issue-75": {
		body: "Same pattern as last week — fresh accounts dropping wallet addresses and airdrop links across older issues. Logging the worst offenders here.",
		comments: [
			flagged(
				75,
				1,
				"0xclaim",
				"send 0.1 ETH to 0x9f…1a2b and receive 1 ETH back, official giveaway",
				"Removed",
				"Crypto address guard",
				15 * DAY,
			),
			flagged(
				75,
				2,
				"giveaway_bot7",
				"elon airdrop live now, connect wallet at eth-2x.app",
				"Hidden",
				"Known spam domains",
				15 * DAY,
			),
			say(
				75,
				3,
				"mara-liang",
				"Added crypto-address detection to the rule pack after this — see #318.",
				14 * DAY,
			),
		],
	},
	"issue-88": {
		body: "On iPhone the primary login button sits ~6px to the right of the card edge. Looks like the flex container isn't accounting for the safe-area inset.",
		comments: [
			say(
				88,
				1,
				"priya-n",
				"Reproduced on a 13 mini. It's the padding-right on the form wrapper.",
				8 * DAY,
			),
			flagged(
				88,
				2,
				"throwaway92",
				"nobody cares about your buggy app, learn to code",
				"Removed",
				"manual · removed by you",
				8 * DAY,
			),
			say(88, 3, "samir-h", "Fixed in #320, closing once it lands.", 7 * DAY),
		],
	},
	"pull-318": {
		body: "Adds a guard that flags comments containing wallet-like addresses (BTC/ETH) from accounts under 7 days old. Closes #75.",
		comments: [
			say(
				318,
				1,
				"mara-liang",
				"Nice — can we make the age threshold configurable per rule?",
				4 * HOUR,
			),
			say(
				318,
				2,
				"devon-okoro",
				"Done, defaults to 7d. Added a test with the addresses from #75.",
				3 * HOUR,
			),
		],
	},
	"pull-312": {
		body: "Adds a dark-mode toggle to the topbar, persisted via next-themes. Surface tokens already exist so this is mostly wiring.",
		comments: [
			say(
				312,
				1,
				"devon-okoro",
				"Approving — clean. One nit on the icon transition, non-blocking.",
				2 * DAY,
			),
			flagged(
				312,
				2,
				"rage_dev",
				"this is trash, why did it take you a week",
				"Hidden",
				"manual · hidden by you",
				2 * DAY,
			),
		],
	},
};

function fallback(s: ThreadSummary): Convo {
	const comments: Comment[] = [
		say(
			s.number,
			1,
			"mara-liang",
			"Thanks for opening this — taking a look now.",
			HOUR,
		),
		say(
			s.number,
			2,
			"priya-n",
			s.kind === "pull"
				? "Left a couple of comments, otherwise looks good to merge."
				: "Reproduced on my end, should be a quick fix.",
			HOUR / 2,
		),
	];
	if (s.flagged > 0) {
		comments.splice(
			1,
			0,
			flagged(
				s.number,
				9,
				"new_user_44",
				"off-topic promo, please check my profile",
				"Hidden",
				"New-account burst",
				HOUR,
			),
		);
	}
	return {
		body:
			s.kind === "pull"
				? "Opening this up for review — details in the title. Happy to split it if it's too large."
				: "Filing this for tracking. Steps to reproduce and context in the title; will add more detail as it comes.",
		comments,
	};
}

function detail(s: ThreadSummary): ThreadDetail {
	const convo = CONVO[`${s.kind}-${s.number}`] ?? fallback(s);
	return {
		kind: s.kind,
		number: s.number,
		title: s.title,
		status: s.status,
		author: s.author,
		openedAt: s.openedAt,
		labels: s.labels,
		body: convo.body,
		comments: convo.comments,
		...(s.kind === "pull"
			? {
					branch: `${s.author}/${s.title
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/^-|-$/g, "")
						.slice(0, 24)}`,
					baseBranch: "main",
				}
			: {}),
	};
}

const REPOS: RepoSummary[] = [
	{
		name: "tripwire",
		description:
			"GitHub moderation bot — automod rules, triage queue, and appeals.",
		visibility: "public",
		openIssues: 4,
		openPulls: 2,
		flagged: 7,
		updatedAt: ago(2 * HOUR),
	},
	{
		name: "automod-rules",
		description: "Shared community automod rule packs and presets.",
		visibility: "public",
		openIssues: 8,
		openPulls: 2,
		flagged: 3,
		updatedAt: ago(5 * HOUR),
	},
	{
		name: "webhooks-gateway",
		description: "Ingest and fan-out for GitHub webhook events.",
		visibility: "private",
		openIssues: 5,
		openPulls: 3,
		flagged: 1,
		updatedAt: ago(3 * DAY),
	},
	{
		name: "tripwire-docs",
		description: "Documentation site for tripwire.",
		visibility: "public",
		openIssues: 3,
		openPulls: 1,
		flagged: 0,
		updatedAt: ago(4 * DAY),
	},
	{
		name: "site",
		description: "Marketing site and changelog.",
		visibility: "public",
		openIssues: 2,
		openPulls: 0,
		flagged: 0,
		updatedAt: ago(8 * DAY),
	},
];

export function seedRepoContent(): RepoContent {
	return {
		repos: REPOS,
		issues: ISSUES,
		pulls: PULLS,
		issueDetails: Object.fromEntries(
			ISSUES.map((s) => [String(s.number), detail(s)]),
		),
		pullDetails: Object.fromEntries(
			PULLS.map((s) => [String(s.number), detail(s)]),
		),
	};
}
