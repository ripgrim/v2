import { z } from "zod";
import { eventKindSchema } from "./events.ts";

/**
 * Workflow domain (spec §4 `workflow.ts`) — AUTHORED from §6. A workflow is a
 * JSON DAG: trigger nodes → rule nodes → gate nodes (all-of / any-of / not) →
 * action nodes. The executor eats this JSON from build step 6; the React Flow
 * editor that emits it comes last.
 *
 * Semantics (enforced by core/workflow):
 * - a node runs when ≥1 incoming edge conducts; a trigger conducts when its
 *   kinds include the event kind.
 * - rule nodes produce pass/fail; `skipped` conducts as pass but is recorded
 *   (a rule that can't evaluate must not block — §6 purity).
 * - edges conduct on the source's outcome: `when: "pass"` (default) | "fail";
 *   `approve`/`deny` edges leave a send-to-moderation node and conduct only
 *   when the moderation decision resumes the run (§6: paused run).
 */

export const gateModeSchema = z.enum(["all-of", "any-of", "not"]);
export type GateMode = z.infer<typeof gateModeSchema>;

export const workflowActionKindSchema = z.enum([
	"block",
	"comment",
	"label",
	"request-review",
	"send-to-moderation",
]);
export type WorkflowActionKind = z.infer<typeof workflowActionKindSchema>;

export const triggerNodeSchema = z.object({
	id: z.string(),
	type: z.literal("trigger"),
	kinds: z.array(eventKindSchema).min(1),
});

export const ruleNodeSchema = z.object({
	id: z.string(),
	type: z.literal("rule"),
	/** `id@version`, e.g. "account-age@1" — the versioning law (§6). */
	ref: z.string().regex(/^[a-z][a-z0-9-]*@\d+$/),
	config: z.unknown(),
});

export const gateNodeSchema = z.object({
	id: z.string(),
	type: z.literal("gate"),
	mode: gateModeSchema,
});

export const actionNodeSchema = z.object({
	id: z.string(),
	type: z.literal("action"),
	action: workflowActionKindSchema,
	params: z.record(z.string(), z.unknown()).optional(),
});

export const workflowNodeSchema = z.discriminatedUnion("type", [
	triggerNodeSchema,
	ruleNodeSchema,
	gateNodeSchema,
	actionNodeSchema,
]);
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;

export const edgeWhenSchema = z.enum(["pass", "fail", "approve", "deny"]);
export type EdgeWhen = z.infer<typeof edgeWhenSchema>;

export const workflowEdgeSchema = z.object({
	id: z.string(),
	from: z.string(),
	to: z.string(),
	/** Default: conducts on "pass". */
	when: edgeWhenSchema.optional(),
});
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;

export const workflowDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	version: z.number().int().min(1),
	nodes: z.array(workflowNodeSchema).min(1),
	edges: z.array(workflowEdgeSchema),
});
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
