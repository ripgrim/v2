import { z } from "zod";
import { itemTypeSchema, modStatSchema } from "./moderation.ts";
import { threadKindSchema } from "./repo-analytics.ts";

/** Automod domain, extracted from the demo's `src/lib/automod.types.ts`. */

export const ruleCategorySchema = z.enum([
	"blocklist",
	"heuristic",
	"classifier",
	"regex",
]);
export type RuleCategory = z.infer<typeof ruleCategorySchema>;

export const ruleActionSchema = z.enum([
	"flag",
	"hide",
	"close",
	"require-review",
]);
export type RuleAction = z.infer<typeof ruleActionSchema>;

export const matchVerdictSchema = z.enum([
	"pending",
	"confirmed",
	"false-positive",
]);
export type MatchVerdict = z.infer<typeof matchVerdictSchema>;

export const automodMatchSchema = z.object({
	id: z.string(),
	type: itemTypeSchema,
	repoFullName: z.string(),
	number: z.number(),
	author: z.object({ login: z.string(), avatarUrl: z.string() }),
	snippet: z.string(),
	matchedAt: z.string(),
	verdict: matchVerdictSchema,
	/** Routes the match back to its conversation. */
	threadKind: threadKindSchema,
	/** The comment to highlight in that thread (matches a thread comment id). */
	commentId: z.string(),
});
export type AutomodMatch = z.infer<typeof automodMatchSchema>;

export const automodRuleSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	category: ruleCategorySchema,
	/** The literal blocklist entry / regex / classifier label that fires. */
	pattern: z.string(),
	scope: z.array(itemTypeSchema),
	action: ruleActionSchema,
	enabled: z.boolean(),
	matches24h: z.number(),
	matches30d: z.number(),
	/** Percentage, 0–100. */
	falsePositiveRate: z.number(),
	lastFiredAt: z.string(),
	/** Match volume over the last 7 days, oldest → newest. Drives the sparkline. */
	trend: z.array(z.number()),
	recentMatches: z.array(automodMatchSchema),
});
export type AutomodRule = z.infer<typeof automodRuleSchema>;

export const automodStatsSchema = z.object({
	activeRules: modStatSchema,
	matches24h: modStatSchema,
	falsePositiveRate: modStatSchema,
	autoActioned24h: modStatSchema,
});
export type AutomodStats = z.infer<typeof automodStatsSchema>;
