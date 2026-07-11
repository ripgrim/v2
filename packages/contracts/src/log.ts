import { z } from "zod";
import {
	actorSchema,
	itemTypeSchema,
	reasonSchema,
	severitySchema,
} from "./moderation.ts";
import { threadKindSchema } from "./repo-analytics.ts";

/** Moderation-log domain, extracted from the demo's `src/lib/log.types.ts`. */

export const logActionSchema = z.enum([
	"removed",
	"hidden",
	"banned",
	"dismissed",
	"required-review",
]);
export type LogAction = z.infer<typeof logActionSchema>;

export const logStatusSchema = z.enum([
	"actioned",
	"dismissed",
	"appealed",
	"reversed",
]);
export type LogStatus = z.infer<typeof logStatusSchema>;

export const caughtKindSchema = z.enum(["automod", "report", "manual"]);
export type CaughtKind = z.infer<typeof caughtKindSchema>;

export const caughtBySchema = z.object({
	kind: caughtKindSchema,
	/** Rule id, "report", or the action verb — drives the "caught by …" line. */
	detail: z.string(),
	/** Present when a person reported it (we show the reporter). */
	reporter: actorSchema.optional(),
});
export type CaughtBy = z.infer<typeof caughtBySchema>;

/** A single step in an entry's lifecycle (flagged → actioned → appealed …). */
export const logStepSchema = z.object({
	at: z.string(),
	label: z.string(),
	by: z.string(),
});
export type LogStep = z.infer<typeof logStepSchema>;

/** One piece of offending content. Bundled entries hold several. */
export const logItemSchema = z.object({
	id: z.string(),
	type: itemTypeSchema,
	repoFullName: z.string(),
	number: z.number(),
	/** Raw content — kept blurred until revealed. */
	content: z.string(),
	/** Routes the item back to its conversation + the comment to highlight. */
	threadKind: threadKindSchema,
	commentId: z.string(),
});
export type LogItem = z.infer<typeof logItemSchema>;

export const logEntrySchema = z.object({
	id: z.string(),
	/** Safe label shown instead of the raw content, e.g. "Racial slur". */
	label: z.string(),
	reason: reasonSchema,
	severity: severitySchema,
	action: logActionSchema,
	status: logStatusSchema,
	author: actorSchema,
	/** The moderator who actioned it; null for a pure automod action. */
	moderator: actorSchema.nullable(),
	caughtBy: caughtBySchema,
	at: z.string(),
	/** We kept our own copy so it survives upstream deletion. */
	snapshot: z.boolean(),
	items: z.array(logItemSchema),
	history: z.array(logStepSchema),
});
export type LogEntry = z.infer<typeof logEntrySchema>;

export const logActionKindSchema = z.enum(["what", "reason", "caught"]);
export type LogActionKind = z.infer<typeof logActionKindSchema>;
