import type {
	RepoAnalytics,
	RepoMetric,
	ThreadAnalytics,
} from "#/lib/repo-analytics.types";
import type { ThreadDetail, ThreadSummary } from "#/lib/repo-content.types";
import { seedRepoContent } from "#/lib/repo-content-mock-data";

/** Deterministic, seed-stable noisy series so dither charts vary but don't jump. */
function series(seed: string, n: number, base: number, variance: number) {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
	}
	const out: number[] = [];
	let v = base;
	for (let i = 0; i < n; i++) {
		h = (Math.imul(h, 48271) + 1) & 0x7fffffff;
		const r = (h % 1000) / 1000 - 0.5;
		v = Math.max(base * 0.25, v + r * variance + (base - v) * 0.12);
		out.push(v);
	}
	return out;
}

const ISSUE_88: ThreadAnalytics = {
	kind: "issue",
	number: 88,
	title: "Login button misaligned on mobile",
	status: "closed",
	meta: "opened by @samir-h · 5 participants · closed 2 days ago",
	series: series("issue88", 40, 4, 6),
	metrics: [
		{
			key: "comments",
			label: "Comments",
			value: 42,
			series: series("i88c", 24, 5, 4),
			color: "blue",
		},
		{
			key: "blocked",
			label: "Comments blocked",
			value: 3,
			sub: "7%",
			series: series("i88b", 24, 1, 1.5),
			color: "red",
		},
		{
			key: "participants",
			label: "Participants",
			value: 5,
			series: series("i88p", 24, 1, 1),
			color: "green",
		},
		{
			key: "automod",
			label: "Automod catches",
			value: 3,
			series: series("i88a", 24, 1, 1.2),
			color: "pink",
		},
	],
	byParticipant: [
		{ login: "samir-h", count: 15 },
		{ login: "priya-n", count: 11 },
		{ login: "mara-liang", count: 8 },
		{ login: "throwaway92", count: 5, flagged: true },
		{ login: "devon-okoro", count: 3 },
	],
	flagged: [
		{
			login: "throwaway92",
			reason: "harassment",
			caughtBy: "manual · removed by you",
			status: "Removed",
			commentId: "88-2",
		},
	],
};

const PULL_312: ThreadAnalytics = {
	kind: "pull",
	number: 312,
	title: "Add dark-mode toggle",
	status: "merged",
	meta: "opened by @priya-n · 4 reviewers · merged 1h ago",
	series: series("pull312", 40, 6, 7),
	metrics: [
		{
			key: "comments",
			label: "Comments",
			value: 28,
			series: series("p312c", 24, 4, 3),
			color: "blue",
		},
		{
			key: "reviews",
			label: "Reviews",
			value: 6,
			sub: "2 changes",
			series: series("p312r", 24, 1, 1),
			color: "purple",
		},
		{
			key: "commits",
			label: "Commits",
			value: 14,
			series: series("p312m", 24, 2, 2),
			color: "green",
		},
		{
			key: "checks",
			label: "Check runs",
			value: 9,
			series: series("p312k", 24, 2, 1.5),
			color: "orange",
		},
	],
	byParticipant: [
		{ login: "priya-n", count: 15 },
		{ login: "mara-liang", count: 11 },
		{ login: "devon-okoro", count: 8 },
		{ login: "throwaway92", count: 5, flagged: true },
		{ login: "ghxst-dev", count: 3 },
	],
	checks: [
		{
			kind: "review",
			title: "@devon-okoro approved",
			detail: "review",
			status: "Approved",
			actor: "devon-okoro",
		},
		{
			kind: "review",
			title: "@mara-liang requested changes",
			detail: "review",
			status: "Changes",
			actor: "mara-liang",
		},
		{
			kind: "check",
			title: "CI / build",
			detail: "GitHub Actions · 1m 12s",
			status: "Passed",
		},
		{
			kind: "check",
			title: "CI / lint",
			detail: "GitHub Actions · 2 errors",
			status: "Failed",
		},
	],
};

function shortReason(body: string): string {
	const b = body.toLowerCase();
	if (/airdrop|crypto|\beth\b|\$sol|wallet|0x/.test(b)) return "crypto spam";
	if (/follow|pump|link in bio|promo/.test(b)) return "spam promo";
	if (/trash|learn to code|nobody cares|idiot/.test(b)) return "harassment";
	return "off-topic";
}

/**
 * Builds a coherent analytics view for any issue/PR from its conversation, so
 * every detail route has a matching analytics counterpart. Hand-authored
 * threads ({@link ISSUE_88}, {@link PULL_312}) override these below.
 */
function buildThread(
	summary: ThreadSummary,
	detail: ThreadDetail,
): ThreadAnalytics {
	const seed = `${summary.kind}${summary.number}`;
	const tally = new Map<string, { count: number; flagged: boolean }>();
	const bump = (login: string, flagged = false) => {
		const e = tally.get(login) ?? { count: 0, flagged: false };
		e.count += 1;
		e.flagged = e.flagged || flagged;
		tally.set(login, e);
	};
	bump(summary.author);
	for (const c of detail.comments) bump(c.author, Boolean(c.flag));

	const visible = [...tally.values()].reduce((a, e) => a + e.count, 0) || 1;
	const scale = Math.max(1, Math.round(summary.comments / visible));
	const byParticipant = [...tally.entries()]
		.map(([login, e]) => ({
			login,
			count: e.count * scale,
			flagged: e.flagged,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	const participants = tally.size;
	const automod = detail.comments.filter(
		(c) => c.flag && !c.flag.rule.includes("manual"),
	).length;
	const pct = summary.comments
		? Math.round((summary.flagged / summary.comments) * 100)
		: 0;

	const metrics: RepoMetric[] = [
		{
			key: "comments",
			label: "Comments",
			value: summary.comments,
			series: series(`${seed}c`, 24, Math.max(2, summary.comments / 6), 3),
			color: "blue",
		},
		{
			key: "blocked",
			label: "Comments blocked",
			value: summary.flagged,
			sub: `${pct}%`,
			series: series(`${seed}b`, 24, 1, 1.4),
			color: "red",
		},
		{
			key: "participants",
			label: "Participants",
			value: participants,
			series: series(`${seed}p`, 24, 1, 1),
			color: "green",
		},
		{
			key: "automod",
			label: "Automod catches",
			value: automod,
			series: series(`${seed}a`, 24, 1, 1.2),
			color: "pink",
		},
	];

	const flaggedList = detail.comments
		.filter((c) => c.flag)
		.map((c) => ({
			login: c.author,
			reason: shortReason(c.body),
			caughtBy: c.flag?.rule ?? "",
			status: c.flag?.state ?? "Hidden",
			commentId: c.id,
		}));

	const verb =
		summary.status === "merged"
			? "merged"
			: summary.status === "closed"
				? "closed"
				: "opened";

	return {
		kind: summary.kind,
		number: summary.number,
		title: summary.title,
		status: summary.status,
		meta: `${verb} by @${summary.author} · ${participants} participants · ${summary.comments} comments`,
		series: series(seed, 40, Math.max(3, summary.comments / 8), 6),
		metrics,
		byParticipant,
		...(summary.kind === "issue"
			? { flagged: flaggedList }
			: {
					checks: [
						{
							kind: "review" as const,
							title: `@${byParticipant[1]?.login ?? summary.author} reviewed`,
							detail: "review",
							status: "Approved" as const,
							actor: byParticipant[1]?.login ?? summary.author,
						},
						{
							kind: "check" as const,
							title: "CI / build",
							detail: "GitHub Actions",
							status: "Passed" as const,
						},
					],
				}),
	};
}

/** All issue/PR threads, keyed `issues/88` / `pulls/312`. */
function buildThreads(): Record<string, ThreadAnalytics> {
	const content = seedRepoContent();
	const out: Record<string, ThreadAnalytics> = {};
	for (const s of content.issues) {
		const d = content.issueDetails[String(s.number)];
		if (d) out[`issues/${s.number}`] = buildThread(s, d);
	}
	for (const s of content.pulls) {
		const d = content.pullDetails[String(s.number)];
		if (d) out[`pulls/${s.number}`] = buildThread(s, d);
	}
	// Hand-authored threads take precedence over the generated ones.
	out["issues/88"] = ISSUE_88;
	out["pulls/312"] = PULL_312;
	return out;
}

export function seedRepoAnalytics(): RepoAnalytics {
	return {
		metrics: [
			{
				key: "comments",
				label: "Comments",
				value: 1204,
				delta: 112,
				series: series("comments", 30, 40, 14),
				color: "blue",
			},
			{
				key: "comments-blocked",
				label: "Comments blocked",
				value: 38,
				delta: 5,
				invertDelta: true,
				series: series("cblocked", 30, 1.3, 1.2),
				color: "red",
			},
			{
				key: "pulls",
				label: "Pull requests",
				value: 96,
				delta: 9,
				series: series("pulls", 30, 3, 2),
				color: "green",
			},
			{
				key: "prs-blocked",
				label: "PRs blocked",
				value: 12,
				delta: 2,
				invertDelta: true,
				series: series("pblocked", 30, 0.5, 0.8),
				color: "orange",
			},
			{
				key: "issues",
				label: "Issues opened",
				value: 54,
				delta: 6,
				series: series("issues", 30, 2, 1.6),
				color: "purple",
			},
			{
				key: "automod",
				label: "Automod catches",
				value: 210,
				delta: 24,
				series: series("automod", 30, 7, 4),
				color: "pink",
			},
		],
		blockedByRule: [
			{ rule: "Known spam domains", count: 18 },
			{ rule: "New-account burst", count: 11 },
			{ rule: "AI slop classifier", count: 6 },
			{ rule: "Crypto address guard", count: 3 },
		],
		activeThreads: [
			{
				kind: "issue",
				number: 88,
				title: "Login button misaligned on mobile",
				comments: 42,
				blocked: 3,
				status: "closed",
			},
			{
				kind: "pull",
				number: 312,
				title: "Add dark-mode toggle",
				comments: 28,
				blocked: 1,
				status: "merged",
			},
			{
				kind: "issue",
				number: 91,
				title: "Crash on iOS 17",
				comments: 19,
				blocked: 2,
				status: "open",
			},
			{
				kind: "pull",
				number: 309,
				title: "Bump dependencies",
				comments: 9,
				blocked: 0,
				status: "merged",
			},
		],
		threads: buildThreads(),
	};
}
