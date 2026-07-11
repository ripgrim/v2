import { z } from "zod";
import { threadKindSchema } from "./insights.ts";
import { itemTypeSchema, modStatSchema } from "./moderation.ts";

/**
 * Rules domain (spec §4 `rules.ts`, §6). Extracted from the demo's
 * `automod.types.ts` — `Rule` was the demo's `AutomodRule`, `RuleMatch` its
 * `AutomodMatch`. The §6 `RuleResult` envelope lands with the rules-registry
 * build step.
 */

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

/** One firing of a rule on content (was demo `AutomodMatch`). */
export const ruleMatchSchema = z.object({
	id: z.string(),
	type: itemTypeSchema,
	repoFullName: z.string(),
	number: z.number(),
	author: z.object({ login: z.string(), avatarUrl: z.string() }),
	snippet: z.string(),
	matchedAt: z.iso.datetime(),
	verdict: matchVerdictSchema,
	/** Routes the match back to its conversation. */
	threadKind: threadKindSchema,
	/** The comment to highlight in that thread (matches a thread comment id). */
	commentId: z.string(),
});
export type RuleMatch = z.infer<typeof ruleMatchSchema>;

/** A configured rule as the Rules surface shows it (was demo `AutomodRule`). */
export const ruleSchema = z.object({
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
	falsePositiveRate: z.number().min(0).max(100),
	lastFiredAt: z.iso.datetime(),
	/** Match volume over the last 7 days, oldest → newest. Drives the sparkline. */
	trend: z.array(z.number()),
	recentMatches: z.array(ruleMatchSchema),
});
export type Rule = z.infer<typeof ruleSchema>;

export const ruleStatsSchema = z.object({
	activeRules: modStatSchema,
	matches24h: modStatSchema,
	falsePositiveRate: modStatSchema,
	autoActioned24h: modStatSchema,
});
export type RuleStats = z.infer<typeof ruleStatsSchema>;
