import { z } from "zod";

/**
 * Moderation domain. Extracted verbatim from the redesign demo's
 * `src/lib/moderation.types.ts` + `mock-data.ts`. These primitives (actor,
 * item type, repository, stat) are reused across the automod and log domains,
 * so they live here as the base of the contract graph.
 */

export const itemTypeSchema = z.enum(["issue", "pull", "comment"]);
export type ItemType = z.infer<typeof itemTypeSchema>;

export const reasonSchema = z.enum([
	"spam",
	"harassment",
	"off-topic",
	"automod",
	"nsfw",
]);
export type Reason = z.infer<typeof reasonSchema>;

export const severitySchema = z.enum(["low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof severitySchema>;

export const modStatusSchema = z.enum(["pending", "resolved"]);
export type ModStatus = z.infer<typeof modStatusSchema>;

export const actorSchema = z.object({
	login: z.string(),
	avatarUrl: z.string(),
});
export type Actor = z.infer<typeof actorSchema>;

export const repositorySchema = z.object({
	owner: z.string(),
	name: z.string(),
	fullName: z.string(),
});
export type Repository = z.infer<typeof repositorySchema>;

export const flaggedItemSchema = z.object({
	id: z.string(),
	type: itemTypeSchema,
	repository: repositorySchema,
	number: z.number(),
	title: z.string(),
	bodyPreview: z.string(),
	author: actorSchema,
	reason: reasonSchema,
	severity: severitySchema,
	/** `null` when the report came from automod rather than a person. */
	reporter: actorSchema.nullable(),
	automodRule: z.string().optional(),
	reportedAt: z.string(),
	status: modStatusSchema,
	comments: z.number(),
	reactions: z.number(),
});
export type FlaggedItem = z.infer<typeof flaggedItemSchema>;

export const modStatSchema = z.object({
	value: z.number(),
	/** Signed change vs. the previous period; drives the ▲/▼ indicator. */
	delta: z.number(),
	/** Hourly trend over the last 24h — drives the card's dither chart. */
	series: z.array(z.number()),
});
export type ModStat = z.infer<typeof modStatSchema>;

export const modStatsSchema = z.object({
	pendingReports: modStatSchema,
	resolvedToday: modStatSchema,
	automodHits24h: modStatSchema,
	bannedUsers: modStatSchema,
});
export type ModStats = z.infer<typeof modStatsSchema>;

export const moderationActionSchema = z.enum(["approve", "remove", "ban"]);
export type ModerationAction = z.infer<typeof moderationActionSchema>;
