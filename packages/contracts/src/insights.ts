import { z } from "zod";

/**
 * Insights domain (spec §4 web surface "Insights" / db `services/insights.ts`).
 * Extracted from the demo's `repo-analytics.types.ts` — `RepoInsights` was the
 * demo's `RepoAnalytics`, `ThreadInsights` its `ThreadAnalytics`.
 * `ditherColorSchema` and the thread enums also back the repo-content domain.
 */

export const ditherColorSchema = z.enum([
	"green",
	"blue",
	"purple",
	"pink",
	"orange",
	"red",
	"grey",
]);
export type DitherColor = z.infer<typeof ditherColorSchema>;

/**
 * Forge-derived values — GitHub controls this set, not tripwire. Stays closed
 * while mocks drive the UI; needs a passthrough/catch variant when real ingest
 * lands (build step 3/4). Do not widen before then.
 */
export const threadKindSchema = z.enum(["issue", "pull"]);
export type ThreadKind = z.infer<typeof threadKindSchema>;

/**
 * Forge-derived values — GitHub controls this set, not tripwire. Stays closed
 * while mocks drive the UI; needs a passthrough/catch variant when real ingest
 * lands (build step 3/4). Do not widen before then.
 */
export const threadStatusSchema = z.enum(["open", "closed", "merged"]);
export type ThreadStatus = z.infer<typeof threadStatusSchema>;

export const repoMetricSchema = z.object({
	key: z.string(),
	label: z.string(),
	value: z.number(),
	/** Signed change vs. the previous period; drives the ▲/▼ indicator. */
	delta: z.number().optional(),
	/** When true a positive delta reads as bad (down = good). */
	invertDelta: z.boolean().optional(),
	/** Small muted context shown next to the value instead of a delta. */
	sub: z.string().optional(),
	series: z.array(z.number()),
	color: ditherColorSchema,
	suffix: z.string().optional(),
});
export type RepoMetric = z.infer<typeof repoMetricSchema>;

export const ruleBlockCountSchema = z.object({
	rule: z.string(),
	count: z.number(),
});
export type RuleBlockCount = z.infer<typeof ruleBlockCountSchema>;

export const activeThreadSchema = z.object({
	kind: threadKindSchema,
	number: z.number(),
	title: z.string(),
	comments: z.number(),
	blocked: z.number(),
	status: threadStatusSchema,
});
export type ActiveThread = z.infer<typeof activeThreadSchema>;

export const participantCountSchema = z.object({
	login: z.string(),
	count: z.number(),
	/** Whether this participant has flagged content — tints the bar red. */
	flagged: z.boolean().optional(),
});
export type ParticipantCount = z.infer<typeof participantCountSchema>;

export const flaggedCommentSchema = z.object({
	login: z.string(),
	reason: z.string(),
	caughtBy: z.string(),
	status: z.enum(["Hidden", "Removed"]),
	/** The comment in the thread this flag refers to, for linking to the root. */
	commentId: z.string().optional(),
});
export type FlaggedComment = z.infer<typeof flaggedCommentSchema>;

export const checkOrReviewSchema = z.object({
	/**
	 * Forge-derived values — review/check outcomes come from GitHub. Stay closed
	 * for mocks; need a passthrough/catch variant when real ingest lands (step 3/4).
	 */
	kind: z.enum(["review", "check"]),
	title: z.string(),
	detail: z.string(),
	status: z.enum(["Approved", "Changes", "Passed", "Failed"]),
	/** Reviewer handle for review rows (drives the avatar). */
	actor: z.string().optional(),
});
export type CheckOrReview = z.infer<typeof checkOrReviewSchema>;

export const threadInsightsSchema = z.object({
	kind: threadKindSchema,
	number: z.number(),
	title: z.string(),
	status: threadStatusSchema,
	/** "opened by @x · 5 participants · merged 1h ago" */
	meta: z.string(),
	metrics: z.array(repoMetricSchema),
	series: z.array(z.number()),
	byParticipant: z.array(participantCountSchema),
	/** Issues surface flagged comments; PRs surface checks & reviews. */
	flagged: z.array(flaggedCommentSchema).optional(),
	checks: z.array(checkOrReviewSchema).optional(),
});
export type ThreadInsights = z.infer<typeof threadInsightsSchema>;

export const repoInsightsSchema = z.object({
	metrics: z.array(repoMetricSchema),
	blockedByRule: z.array(ruleBlockCountSchema),
	activeThreads: z.array(activeThreadSchema),
	/** Keyed by `${kind}s/${number}`, e.g. "issues/88" or "pulls/312". */
	threads: z.record(z.string(), threadInsightsSchema),
});
export type RepoInsights = z.infer<typeof repoInsightsSchema>;
