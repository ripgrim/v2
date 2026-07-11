import type { FlaggedItem, ModStats } from "#/lib/moderation.types";

const avatar = (login: string) => `https://github.com/${login}.png`;

type SeedItem = Omit<FlaggedItem, "reportedAt" | "status"> & {
	minutesAgo: number;
};

// Hand-authored queue — deliberately varied across type, reason, and severity
// so every branch of the UI (icons, pills, automod attribution) is exercised.
const SEED: SeedItem[] = [
	{
		id: "fi_01",
		type: "comment",
		repository: {
			owner: "vercel",
			name: "next.js",
			fullName: "vercel/next.js",
		},
		number: 58213,
		title: "buy cheap followers + crypto airdrop 🚀🚀 link in bio",
		bodyPreview:
			"GET 10K FOLLOWERS FAST!! claim your free $SOL airdrop now 👉 sketchy-link.xyz before it's gone…",
		author: { login: "growth-hacker-9001", avatarUrl: avatar("ghost") },
		reason: "spam",
		severity: "high",
		reporter: { login: "leerob", avatarUrl: avatar("leerob") },
		minutesAgo: 4,
		comments: 0,
		reactions: 0,
	},
	{
		id: "fi_02",
		type: "issue",
		repository: {
			owner: "facebook",
			name: "react",
			fullName: "facebook/react",
		},
		number: 31044,
		title: "you people are clueless, this whole library is garbage",
		bodyPreview:
			"honestly whoever wrote the reconciler should be ashamed. you're all incompetent and…",
		author: { login: "rage-poster", avatarUrl: avatar("ghost") },
		reason: "harassment",
		severity: "critical",
		reporter: { login: "gaearon", avatarUrl: avatar("gaearon") },
		minutesAgo: 11,
		comments: 7,
		reactions: 2,
	},
	{
		id: "fi_03",
		type: "comment",
		repository: {
			owner: "tailwindlabs",
			name: "tailwindcss",
			fullName: "tailwindlabs/tailwindcss",
		},
		number: 14920,
		title: "Automod: matched blocklist pattern in comment",
		bodyPreview:
			"This comment was automatically flagged because it contains links matching the known-spam domain list.",
		author: { login: "tmp-account-44", avatarUrl: avatar("ghost") },
		reason: "automod",
		severity: "medium",
		reporter: null,
		automodRule: "blocklist/spam-domains",
		minutesAgo: 19,
		comments: 0,
		reactions: 0,
	},
	{
		id: "fi_04",
		type: "pull",
		repository: { owner: "shadcn-ui", name: "ui", fullName: "shadcn-ui/ui" },
		number: 6621,
		title: "Add 4000 lines of unrelated vendored code",
		bodyPreview:
			"This PR bundles a minified payload and modifies the CI workflow to exfiltrate secrets to an external host.",
		author: { login: "supply-chain-bot", avatarUrl: avatar("ghost") },
		reason: "automod",
		severity: "critical",
		reporter: null,
		automodRule: "ci/workflow-tampering",
		minutesAgo: 26,
		comments: 1,
		reactions: 0,
	},
	{
		id: "fi_05",
		type: "issue",
		repository: {
			owner: "withastro",
			name: "astro",
			fullName: "withastro/astro",
		},
		number: 12087,
		title: "where do you live? we should talk in person about this bug",
		bodyPreview:
			"posting the maintainer's home address and phone number in the issue body, demanding a call…",
		author: { login: "creepy-reporter", avatarUrl: avatar("ghost") },
		reason: "harassment",
		severity: "critical",
		reporter: { login: "matthewp", avatarUrl: avatar("matthewp") },
		minutesAgo: 38,
		comments: 3,
		reactions: 0,
	},
	{
		id: "fi_06",
		type: "comment",
		repository: { owner: "vercel", name: "ai", fullName: "vercel/ai" },
		number: 4412,
		title: "checkout my onlyfans 🔥 not safe for work content here",
		bodyPreview:
			"explicit promotional content posted across multiple issue threads with image links…",
		author: { login: "nsfw-promo", avatarUrl: avatar("ghost") },
		reason: "nsfw",
		severity: "high",
		reporter: { login: "shuding", avatarUrl: avatar("shuding") },
		minutesAgo: 52,
		comments: 0,
		reactions: 0,
	},
	{
		id: "fi_07",
		type: "issue",
		repository: { owner: "honojs", name: "hono", fullName: "honojs/hono" },
		number: 3380,
		title: "+1 +1 +1 please merge this is urgent for my job interview tomorrow",
		bodyPreview:
			"spamming the same +1 across 30 issues within two minutes. low-effort thread noise.",
		author: { login: "plus-one-guy", avatarUrl: avatar("ghost") },
		reason: "off-topic",
		severity: "low",
		reporter: { login: "yusukebe", avatarUrl: avatar("yusukebe") },
		minutesAgo: 74,
		comments: 12,
		reactions: 1,
	},
	{
		id: "fi_08",
		type: "comment",
		repository: {
			owner: "drizzle-team",
			name: "drizzle-orm",
			fullName: "drizzle-team/drizzle-orm",
		},
		number: 2901,
		title: "Automod: new account posting external links",
		bodyPreview:
			"Account created 2 minutes ago posted 6 identical comments containing shortened URLs.",
		author: { login: "fresh-acct-77", avatarUrl: avatar("ghost") },
		reason: "automod",
		severity: "medium",
		reporter: null,
		automodRule: "heuristics/new-account-burst",
		minutesAgo: 96,
		comments: 0,
		reactions: 0,
	},
	{
		id: "fi_09",
		type: "pull",
		repository: { owner: "biomejs", name: "biome", fullName: "biomejs/biome" },
		number: 5512,
		title: "fix typo (also deletes the entire test suite)",
		bodyPreview:
			"Innocuous-looking title, but the diff removes 240 test files and disables the lint job.",
		author: { login: "sneaky-contrib", avatarUrl: avatar("ghost") },
		reason: "off-topic",
		severity: "high",
		reporter: { login: "ematipico", avatarUrl: avatar("ematipico") },
		minutesAgo: 130,
		comments: 4,
		reactions: 0,
	},
	{
		id: "fi_10",
		type: "issue",
		repository: {
			owner: "pmndrs",
			name: "zustand",
			fullName: "pmndrs/zustand",
		},
		number: 2744,
		title: "make me a website for free or else",
		bodyPreview:
			"off-topic demand unrelated to the library, with mild threats toward maintainers if ignored.",
		author: { login: "entitled-user", avatarUrl: avatar("ghost") },
		reason: "off-topic",
		severity: "low",
		reporter: { login: "dai-shi", avatarUrl: avatar("dai-shi") },
		minutesAgo: 184,
		comments: 2,
		reactions: 0,
	},
	{
		id: "fi_11",
		type: "comment",
		repository: {
			owner: "remix-run",
			name: "react-router",
			fullName: "remix-run/react-router",
		},
		number: 12810,
		title: "your PR was trash and so are you, go back to jquery lol",
		bodyPreview:
			"personal insult directed at a first-time contributor on their merged pull request…",
		author: { login: "toxic-reviewer", avatarUrl: avatar("ghost") },
		reason: "harassment",
		severity: "high",
		reporter: { login: "mjackson", avatarUrl: avatar("mjackson") },
		minutesAgo: 240,
		comments: 1,
		reactions: 3,
	},
	{
		id: "fi_12",
		type: "comment",
		repository: {
			owner: "TanStack",
			name: "query",
			fullName: "TanStack/query",
		},
		number: 8190,
		title: "FREE STEAM GIFT CARDS no survey 100% working 2026",
		bodyPreview:
			"classic scam comment pasted into a popular thread to farm clicks. links to phishing page.",
		author: { login: "giftcard-scammer", avatarUrl: avatar("ghost") },
		reason: "spam",
		severity: "medium",
		reporter: { login: "tannerlinsley", avatarUrl: avatar("tannerlinsley") },
		minutesAgo: 320,
		comments: 0,
		reactions: 0,
	},
	{
		id: "fi_13",
		type: "issue",
		repository: {
			owner: "cloudflare",
			name: "workers-sdk",
			fullName: "cloudflare/workers-sdk",
		},
		number: 7705,
		title: "Automod: profanity threshold exceeded",
		bodyPreview:
			"Issue body tripped the profanity classifier with a confidence score of 0.94.",
		author: { login: "angry-dev-3", avatarUrl: avatar("ghost") },
		reason: "automod",
		severity: "low",
		reporter: null,
		automodRule: "classifier/profanity",
		minutesAgo: 420,
		comments: 5,
		reactions: 0,
	},
	{
		id: "fi_14",
		type: "pull",
		repository: {
			owner: "supabase",
			name: "supabase",
			fullName: "supabase/supabase",
		},
		number: 31992,
		title: "Update README (injects tracking pixel into docs)",
		bodyPreview:
			"PR adds an <img> beacon to every docs page pointing at an attacker-controlled endpoint.",
		author: { login: "pixel-tracker", avatarUrl: avatar("ghost") },
		reason: "spam",
		severity: "high",
		reporter: { login: "kiwicopple", avatarUrl: avatar("kiwicopple") },
		minutesAgo: 540,
		comments: 2,
		reactions: 0,
	},
];

export function seedFlaggedItems(now: number): FlaggedItem[] {
	return SEED.map(({ minutesAgo, ...item }) => ({
		...item,
		status: "pending",
		reportedAt: new Date(now - minutesAgo * 60_000).toISOString(),
	}));
}

export function seedStats(): ModStats {
	return {
		pendingReports: {
			value: 14,
			delta: 5,
			series: [4, 6, 5, 8, 7, 10, 9, 12, 8, 11, 9, 13, 10, 12, 9, 14],
		},
		resolvedToday: {
			value: 38,
			delta: 12,
			series: [2, 4, 6, 5, 9, 12, 14, 18, 22, 25, 28, 30, 33, 35, 36, 38],
		},
		automodHits24h: {
			value: 126,
			delta: -8,
			series: [9, 14, 11, 18, 22, 16, 24, 20, 28, 19, 15, 23, 18, 13, 16, 12],
		},
		bannedUsers: {
			value: 9,
			delta: 3,
			series: [1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9],
		},
	};
}
