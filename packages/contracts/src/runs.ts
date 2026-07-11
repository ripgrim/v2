import { z } from "zod";
import { threadKindSchema } from "./insights.ts";
import {
	actorSchema,
	itemTypeSchema,
	reasonSchema,
	severitySchema,
} from "./moderation.ts";

/**
 * Runs domain (spec §4 `runs.ts`: auditable runs + steps). Extracted from the
 * demo's `log.types.ts` — the moderation log IS the runs surface. `Run` was the
 * demo's `LogEntry`, `RunStep` its `LogStep`, `RunItem` its `LogItem`. The §4
 * `Verdict` union lands with the executor build step.
 */

export const runActionSchema = z.enum([
	"removed",
	"hidden",
	"banned",
	"dismissed",
	"required-review",
]);
export type RunAction = z.infer<typeof runActionSchema>;

export const runStatusSchema = z.enum([
	"actioned",
	"dismissed",
	"appealed",
	"reversed",
]);
export type RunStatus = z.infer<typeof runStatusSchema>;

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

/** A single step in a run's lifecycle (flagged → actioned → appealed …). */
export const runStepSchema = z.object({
	at: z.iso.datetime(),
	label: z.string(),
	by: z.string(),
});
export type RunStep = z.infer<typeof runStepSchema>;

/** One piece of offending content in a run. Bundled runs hold several. */
export const runItemSchema = z.object({
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
export type RunItem = z.infer<typeof runItemSchema>;

/** An auditable run (was demo `LogEntry`). */
export const runSchema = z.object({
	id: z.string(),
	/** Safe label shown instead of the raw content, e.g. "Racial slur". */
	label: z.string(),
	reason: reasonSchema,
	severity: severitySchema,
	action: runActionSchema,
	status: runStatusSchema,
	author: actorSchema,
	/** The moderator who actioned it; null for a pure automod action. */
	moderator: actorSchema.nullable(),
	caughtBy: caughtBySchema,
	at: z.iso.datetime(),
	/** We kept our own copy so it survives upstream deletion. */
	snapshot: z.boolean(),
	items: z.array(runItemSchema),
	history: z.array(runStepSchema),
});
export type Run = z.infer<typeof runSchema>;

export const runActionKindSchema = z.enum(["what", "reason", "caught"]);
export type RunActionKind = z.infer<typeof runActionKindSchema>;
