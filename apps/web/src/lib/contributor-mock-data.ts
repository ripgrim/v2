import type {
	ContributionYear,
	ContributorActivity,
	ContributorProfile,
} from "#/lib/contributor.types";
import { MODERATOR } from "#/lib/site-config";

// Deterministic per-handle so a profile looks the same across navigations.
function hashString(s: string): number {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < s.length; i++) {
		h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	}
	return h >>> 0;
}

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const WEEKS = 53;
const DAYS = 7;
const DAY_MS = 86_400_000;
const LOCATIONS = [null, "San Francisco", "Berlin", "Lagos", "—", "Remote"];

// 53×7 grid of intensity levels (0–4) plus the summed contribution count.
function seedContributions(rand: () => number): ContributionYear {
	const weeks: number[][] = [];
	let total = 0;
	// A baseline cadence with occasional busy streaks, GitHub-graph style.
	for (let w = 0; w < WEEKS; w++) {
		const streak = rand() < 0.18 ? 1.8 : 1;
		const col: number[] = [];
		for (let d = 0; d < DAYS; d++) {
			const r = rand();
			// Weekends quiet down a little.
			const lull = d === 0 || d === 6 ? 0.65 : 1;
			const count = r < 0.4 ? 0 : Math.round((r - 0.4) * 18 * streak * lull);
			total += count;
			col.push(level(count));
		}
		weeks.push(col);
	}
	return { total, weeks };
}

function level(count: number): number {
	if (count <= 0) return 0;
	if (count <= 2) return 1;
	if (count <= 5) return 2;
	if (count <= 9) return 3;
	return 4;
}

function pick<T>(rand: () => number, arr: T[]): T {
	return arr[Math.floor(rand() * arr.length)];
}

function seedActivity(
	handle: string,
	rand: () => number,
	joinedDaysAgo: number,
	now: number,
): ContributorActivity[] {
	const owner = MODERATOR.login;
	const num = () => 30 + Math.floor(rand() * 480);
	// Recent → old; minutes for the freshest, then hours, then days.
	const recent: Omit<ContributorActivity, "id" | "at">[] = [
		{
			kind: "automod-hidden",
			title: "Comment hidden by automod",
			detail: "Known spam domains",
		},
		{
			kind: "pull-opened",
			title: `Opened pull request #${num()}`,
			detail: `${owner}/modkit`,
		},
		{
			kind: "comment-removed",
			title: "You removed a comment",
			detail: `spam · #${num()}`,
		},
		{
			kind: "issue-comment",
			title: `Commented on issue #${num()}`,
			detail: `${owner}/tripwire`,
		},
		{
			kind: "flagged",
			title: "Flagged by New-account burst",
			detail: "heuristic",
		},
	];

	let cursor = 8 + Math.floor(rand() * 30); // minutes ago for the first event
	const out: ContributorActivity[] = recent.map((e, i) => {
		const at = new Date(now - cursor * 60_000).toISOString();
		// Grow the gap between events as we walk into the past.
		cursor += (i + 1) * (40 + Math.floor(rand() * 180));
		return { ...e, id: `${handle}-act-${i}`, at };
	});

	// The account's birthday always anchors the bottom of the feed.
	out.push({
		id: `${handle}-act-created`,
		kind: "account-created",
		title: "Created GitHub account",
		detail: `github.com/${handle}`,
		at: new Date(now - joinedDaysAgo * DAY_MS).toISOString(),
	});
	return out;
}

/** Build a stable, plausible profile for any handle. */
export function seedContributorProfile(
	handle: string,
	now: number,
): ContributorProfile {
	const rand = mulberry32(hashString(handle));
	const joinedDaysAgo = 3 + Math.floor(rand() * 900);

	return {
		handle,
		initial: (handle[0] ?? "?").toUpperCase(),
		joinedDaysAgo,
		publicRepos: Math.floor(rand() * 24),
		followers: Math.floor(rand() * rand() * 400),
		watchlisted: rand() < 0.5,
		contributions: seedContributions(rand),
		details: {
			accountAgeDays: joinedDaysAgo,
			location: pick(rand, LOCATIONS),
			emailVerified: rand() < 0.55,
			twoFactor: rand() < 0.45,
		},
		repoStats: {
			mergedPrs: Math.floor(rand() * 6),
			openPrs: Math.floor(rand() * 4),
			comments: Math.floor(rand() * 40),
			hiddenByAutomod: Math.floor(rand() * rand() * 8),
		},
		activity: seedActivity(handle, rand, joinedDaysAgo, now),
	};
}
