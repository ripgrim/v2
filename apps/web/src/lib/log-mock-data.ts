import type { LogEntry } from "#/lib/log.types";

const avatar = (login: string) => `https://github.com/${login}.png`;
const actor = (login: string) => ({ login, avatarUrl: avatar(login) });

type Seed = Omit<LogEntry, "at" | "history" | "items"> & {
	minutesAgo: number;
	items: Array<Omit<LogEntry["items"][number], "id">>;
	steps: Array<{ minutesAgo: number; label: string; by: string }>;
};

// Every item points at a real comment in the active repo (acme/tripwire) so the
// log traces straight to where the content was said — open an item to land on
// the thread with that comment highlighted.
const SEED: Seed[] = [
	{
		id: "log_01",
		label: "New-account spam burst",
		reason: "spam",
		severity: "high",
		action: "hidden",
		status: "actioned",
		author: actor("new_user_44"),
		moderator: null,
		caughtBy: { kind: "automod", detail: "heuristics/new-account-burst" },
		snapshot: true,
		minutesAgo: 8,
		items: [
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 97,
				threadKind: "issue",
				commentId: "97-2",
				content: "join our pump group, 100x guaranteed, dm me",
			},
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 91,
				threadKind: "issue",
				commentId: "91-9",
				content: "off-topic promo, please check my profile",
			},
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 314,
				threadKind: "pull",
				commentId: "314-9",
				content: "off-topic promo, please check my profile",
			},
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 83,
				threadKind: "issue",
				commentId: "83-9",
				content: "off-topic promo, please check my profile",
			},
		],
		steps: [
			{ minutesAgo: 8, label: "Flagged by automod", by: "automod" },
			{ minutesAgo: 8, label: "Hidden", by: "automod" },
		],
	},
	{
		id: "log_02",
		label: "Personal attack",
		reason: "harassment",
		severity: "critical",
		action: "removed",
		status: "appealed",
		author: actor("throwaway92"),
		moderator: actor("ripgrim"),
		caughtBy: { kind: "report", detail: "report", reporter: actor("priya-n") },
		snapshot: true,
		minutesAgo: 26,
		items: [
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 88,
				threadKind: "issue",
				commentId: "88-2",
				content: "nobody cares about your buggy app, learn to code",
			},
		],
		steps: [
			{ minutesAgo: 28, label: "Reported by priya-n", by: "priya-n" },
			{ minutesAgo: 26, label: "Removed", by: "ripgrim" },
			{ minutesAgo: 12, label: "Author appealed", by: "throwaway92" },
		],
	},
	{
		id: "log_03",
		label: "Crypto wallet drain",
		reason: "spam",
		severity: "critical",
		action: "removed",
		status: "actioned",
		author: actor("0xclaim"),
		moderator: null,
		caughtBy: { kind: "automod", detail: "blocklist/crypto-address-guard" },
		snapshot: true,
		minutesAgo: 44,
		items: [
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 75,
				threadKind: "issue",
				commentId: "75-1",
				content:
					"send 0.1 ETH to 0x9f…1a2b and receive 1 ETH back, official giveaway",
			},
		],
		steps: [
			{ minutesAgo: 44, label: "Flagged by automod", by: "automod" },
			{ minutesAgo: 44, label: "Removed + author banned", by: "automod" },
		],
	},
	{
		id: "log_04",
		label: "Spam domain link",
		reason: "spam",
		severity: "medium",
		action: "hidden",
		status: "actioned",
		author: actor("giveaway_bot7"),
		moderator: null,
		caughtBy: { kind: "automod", detail: "blocklist/spam-domains" },
		snapshot: true,
		minutesAgo: 95,
		items: [
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 75,
				threadKind: "issue",
				commentId: "75-2",
				content: "elon airdrop live now, connect wallet at eth-2x.app",
			},
		],
		steps: [
			{ minutesAgo: 95, label: "Flagged by automod", by: "automod" },
			{ minutesAgo: 95, label: "Hidden", by: "automod" },
		],
	},
	{
		id: "log_05",
		label: "Airdrop promo",
		reason: "spam",
		severity: "high",
		action: "hidden",
		status: "actioned",
		author: actor("airdrop_king"),
		moderator: null,
		caughtBy: { kind: "automod", detail: "blocklist/spam-domains" },
		snapshot: true,
		minutesAgo: 150,
		items: [
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 97,
				threadKind: "issue",
				commentId: "97-1",
				content:
					"🚀 FREE $SOL airdrop, claim now 👉 sol-claim.xyz before it ends!!",
			},
		],
		steps: [
			{ minutesAgo: 150, label: "Flagged by automod", by: "automod" },
			{ minutesAgo: 150, label: "Hidden", by: "automod" },
		],
	},
	{
		id: "log_06",
		label: "Toxic review",
		reason: "harassment",
		severity: "medium",
		action: "hidden",
		status: "actioned",
		author: actor("rage_dev"),
		moderator: actor("ripgrim"),
		caughtBy: { kind: "manual", detail: "manual" },
		snapshot: true,
		minutesAgo: 320,
		items: [
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 312,
				threadKind: "pull",
				commentId: "312-2",
				content: "this is trash, why did it take you a week",
			},
		],
		steps: [
			{ minutesAgo: 322, label: "Spotted by ripgrim", by: "ripgrim" },
			{ minutesAgo: 320, label: "Hidden", by: "ripgrim" },
		],
	},
	{
		id: "log_07",
		label: "Follower farming",
		reason: "spam",
		severity: "high",
		action: "removed",
		status: "actioned",
		author: actor("burner4821"),
		moderator: actor("ripgrim"),
		caughtBy: {
			kind: "report",
			detail: "report",
			reporter: actor("devon-okoro"),
		},
		snapshot: true,
		minutesAgo: 430,
		items: [
			{
				type: "comment",
				repoFullName: "acme/tripwire",
				number: 97,
				threadKind: "issue",
				commentId: "97-4",
				content: "cheap followers + crypto, link in bio",
			},
		],
		steps: [
			{ minutesAgo: 436, label: "Reported by devon-okoro", by: "devon-okoro" },
			{ minutesAgo: 430, label: "Removed", by: "ripgrim" },
		],
	},
];

export function seedLogEntries(now: number): LogEntry[] {
	return SEED.map(({ minutesAgo, items, steps, ...entry }) => ({
		...entry,
		at: new Date(now - minutesAgo * 60_000).toISOString(),
		items: items.map((item, i) => ({ ...item, id: `${entry.id}_i${i}` })),
		history: steps.map((s) => ({
			at: new Date(now - s.minutesAgo * 60_000).toISOString(),
			label: s.label,
			by: s.by,
		})),
	}));
}
