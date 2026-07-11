import { describe, expect, test } from "bun:test";
import {
	automodRuleSchema,
	contributorProfileSchema,
	flaggedItemSchema,
	githubIntegrationSchema,
	logEntrySchema,
	repoAnalyticsSchema,
	repoContentSchema,
} from "./index.ts";

/**
 * Contract-layer smoke test (§11): representative mock shapes lifted from the
 * redesign demo must parse. Samples mirror `apps/web/src/lib/*-mock-data.ts`;
 * packages never import apps, so they are inlined here.
 */

describe("contracts parse demo shapes", () => {
	test("flaggedItem — automod attribution, null reporter", () => {
		expect(() =>
			flaggedItemSchema.parse({
				id: "fi_03",
				type: "comment",
				repository: {
					owner: "tailwindlabs",
					name: "tailwindcss",
					fullName: "tailwindlabs/tailwindcss",
				},
				number: 14_920,
				title: "Automod: matched blocklist pattern in comment",
				bodyPreview: "This comment was automatically flagged…",
				author: { login: "tmp-account-44", avatarUrl: "https://x/y.png" },
				reason: "automod",
				severity: "medium",
				reporter: null,
				automodRule: "blocklist/spam-domains",
				reportedAt: "2026-07-11T00:00:00.000Z",
				status: "pending",
				comments: 0,
				reactions: 0,
			}),
		).not.toThrow();
	});

	test("automodRule — nested recent match", () => {
		expect(() =>
			automodRuleSchema.parse({
				id: "rule_blocklist_spam_domains",
				name: "Known spam domains",
				description: "Blocks links to blocklisted domains.",
				category: "blocklist",
				pattern: "blocklist/spam-domains",
				scope: ["issue", "comment"],
				action: "hide",
				enabled: true,
				matches24h: 41,
				matches30d: 1180,
				falsePositiveRate: 1.4,
				lastFiredAt: "2026-07-11T00:00:00.000Z",
				trend: [22, 30, 18, 27, 35, 44, 41],
				recentMatches: [
					{
						id: "m_01",
						type: "comment",
						repoFullName: "acme/tripwire",
						number: 97,
						author: { login: "airdrop_king", avatarUrl: "https://x/y.png" },
						snippet: "🚀 FREE $SOL airdrop",
						matchedAt: "2026-07-11T00:00:00.000Z",
						verdict: "pending",
						threadKind: "issue",
						commentId: "97-1",
					},
				],
			}),
		).not.toThrow();
	});

	test("logEntry — null moderator, lifecycle history", () => {
		expect(() =>
			logEntrySchema.parse({
				id: "log_01",
				label: "New-account spam burst",
				reason: "spam",
				severity: "high",
				action: "hidden",
				status: "actioned",
				author: { login: "new_user_44", avatarUrl: "https://x/y.png" },
				moderator: null,
				caughtBy: { kind: "automod", detail: "heuristics/new-account-burst" },
				at: "2026-07-11T00:00:00.000Z",
				snapshot: true,
				items: [
					{
						id: "li_01",
						type: "comment",
						repoFullName: "acme/tripwire",
						number: 97,
						content: "join our pump group",
						threadKind: "issue",
						commentId: "97-2",
					},
				],
				history: [
					{ at: "2026-07-11T00:00:00.000Z", label: "flagged", by: "automod" },
				],
			}),
		).not.toThrow();
	});

	test("contributorProfile — nullable location", () => {
		expect(() =>
			contributorProfileSchema.parse({
				handle: "octocat",
				initial: "O",
				joinedDaysAgo: 900,
				publicRepos: 12,
				followers: 34,
				watchlisted: false,
				contributions: { total: 3, weeks: [[0, 1, 2, 3, 4, 0, 1]] },
				details: {
					accountAgeDays: 900,
					location: null,
					emailVerified: true,
					twoFactor: false,
				},
				repoStats: {
					mergedPrs: 2,
					openPrs: 1,
					comments: 9,
					hiddenByAutomod: 0,
				},
				activity: [
					{
						id: "a_01",
						kind: "account-created",
						title: "Account created",
						detail: "900 days ago",
						at: "2024-01-01T00:00:00.000Z",
					},
				],
			}),
		).not.toThrow();
	});

	test("githubIntegration, repoAnalytics, repoContent parse minimal shapes", () => {
		expect(() =>
			githubIntegrationSchema.parse({
				accounts: [],
				repos: [],
				activeRepoId: "r1",
			}),
		).not.toThrow();
		expect(() =>
			repoAnalyticsSchema.parse({
				metrics: [],
				blockedByRule: [],
				activeThreads: [],
				threads: {},
			}),
		).not.toThrow();
		expect(() =>
			repoContentSchema.parse({
				repos: [],
				issues: [],
				pulls: [],
				issueDetails: {},
				pullDetails: {},
			}),
		).not.toThrow();
	});

	test("the schema is the muzzle — bad enum rejected", () => {
		expect(() =>
			flaggedItemSchema.parse({
				id: "x",
				type: "not-a-type",
				repository: { owner: "a", name: "b", fullName: "a/b" },
				number: 1,
				title: "t",
				bodyPreview: "b",
				author: { login: "a", avatarUrl: "u" },
				reason: "spam",
				severity: "low",
				reporter: null,
				reportedAt: "2026-07-11T00:00:00.000Z",
				status: "pending",
				comments: 0,
				reactions: 0,
			}),
		).toThrow();
	});
});
