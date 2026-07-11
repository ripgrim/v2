import { z } from "zod";
import { threadKindSchema, threadStatusSchema } from "./repo-analytics.ts";

/** Repo-content domain, extracted from the demo's `src/lib/repo-content.types.ts`. */

export const visibilitySchema = z.enum(["public", "private"]);
export type Visibility = z.infer<typeof visibilitySchema>;

/** A colored issue/PR label chip. `className` carries text + subtle bg tints. */
export const labelSchema = z.object({
	name: z.string(),
	className: z.string(),
});
export type Label = z.infer<typeof labelSchema>;

export const repoSummarySchema = z.object({
	name: z.string(),
	description: z.string(),
	visibility: visibilitySchema,
	openIssues: z.number(),
	openPulls: z.number(),
	/** Flagged/blocked comments in the recent window — the modkit signal. */
	flagged: z.number(),
	updatedAt: z.string(),
});
export type RepoSummary = z.infer<typeof repoSummarySchema>;

/** A row in an issues/pulls list. */
export const threadSummarySchema = z.object({
	kind: threadKindSchema,
	number: z.number(),
	title: z.string(),
	status: threadStatusSchema,
	author: z.string(),
	openedAt: z.string(),
	comments: z.number(),
	/** Count of hidden/removed comments in the thread. */
	flagged: z.number(),
	labels: z.array(labelSchema),
});
export type ThreadSummary = z.infer<typeof threadSummarySchema>;

export const commentFlagSchema = z.object({
	state: z.enum(["Hidden", "Removed"]),
	rule: z.string(),
});
export type CommentFlag = z.infer<typeof commentFlagSchema>;

export const commentSchema = z.object({
	id: z.string(),
	author: z.string(),
	body: z.string(),
	createdAt: z.string(),
	/** Present when automod hid the comment or a moderator removed it. */
	flag: commentFlagSchema.optional(),
});
export type Comment = z.infer<typeof commentSchema>;

/** A full issue/PR conversation. */
export const threadDetailSchema = z.object({
	kind: threadKindSchema,
	number: z.number(),
	title: z.string(),
	status: threadStatusSchema,
	author: z.string(),
	openedAt: z.string(),
	labels: z.array(labelSchema),
	body: z.string(),
	comments: z.array(commentSchema),
	/** PR-only branch context. */
	branch: z.string().optional(),
	baseBranch: z.string().optional(),
});
export type ThreadDetail = z.infer<typeof threadDetailSchema>;

export const repoContentSchema = z.object({
	repos: z.array(repoSummarySchema),
	issues: z.array(threadSummarySchema),
	pulls: z.array(threadSummarySchema),
	/** Keyed by issue number (as string). */
	issueDetails: z.record(z.string(), threadDetailSchema),
	/** Keyed by pull number (as string). */
	pullDetails: z.record(z.string(), threadDetailSchema),
});
export type RepoContent = z.infer<typeof repoContentSchema>;
