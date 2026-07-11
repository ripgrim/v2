import {
	ruleResultSchema,
	type Verdict,
	type WorkflowDefinition,
	workflowDefinitionSchema,
} from "@tripwire/contracts";
import { generateId } from "@tripwire/utils";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../client.ts";
import { runActions, runSteps, runs } from "../schema/runs.ts";

/**
 * Run persistence (§5.10–5.12). The workflow definition is SNAPSHOT onto the
 * run — later edits never change what a historical run page shows. Actions
 * are recorded as rows FIRST and marked executed after, so a crash mid-run
 * can never double-block on retry.
 */

const snapshotSchema = z.array(workflowDefinitionSchema).min(1);

export interface CreateRunInput {
	eventId: string;
	repoFullName: string;
	subjectNumber: number | null;
	headSha: string | null;
	/** Every workflow definition that fired, joined into ONE run (§5.11). */
	snapshot: WorkflowDefinition[];
	status: "running" | "paused" | "completed";
	verdict: Verdict | null;
}

export async function createRun(db: Db, input: CreateRunInput) {
	const snapshot = snapshotSchema.parse(input.snapshot);
	const id = generateId();
	await db.insert(runs).values({
		id,
		eventId: input.eventId,
		repoFullName: input.repoFullName,
		subjectNumber: input.subjectNumber,
		headSha: input.headSha,
		status: input.status,
		verdict: input.verdict,
		workflowSnapshot: snapshot,
		completedAt: input.status === "completed" ? new Date() : null,
	});
	return id;
}

export interface RecordStepInput {
	nodeId: string;
	nodeKind: string;
	ruleRef?: string;
	status: string;
	input: unknown;
	output: unknown;
	startedAt: string;
	finishedAt: string;
	durationMs: number;
}

export async function recordSteps(
	db: Db,
	runId: string,
	steps: RecordStepInput[],
): Promise<void> {
	if (steps.length === 0) {
		return;
	}
	await db.insert(runSteps).values(
		steps.map((step) => ({
			id: generateId(),
			runId,
			nodeId: step.nodeId,
			nodeKind: step.nodeKind,
			ruleId: step.ruleRef ?? null,
			status: step.status,
			input: step.input ?? null,
			output: step.output ?? null,
			/** Rule steps: the validated RuleResult envelope IS the evidence. */
			evidence:
				step.nodeKind === "rule" && step.output
					? ruleResultSchema.parse(step.output)
					: null,
			startedAt: new Date(step.startedAt),
			finishedAt: new Date(step.finishedAt),
			durationMs: step.durationMs,
		})),
	);
}

export interface RecordActionInput {
	kind: string;
	payload: Record<string, unknown>;
	idempotencyKey: string;
}

export async function recordActions(
	db: Db,
	runId: string,
	actions: RecordActionInput[],
): Promise<{ id: string; kind: string; payload: Record<string, unknown> }[]> {
	if (actions.length === 0) {
		return [];
	}
	const rows = actions.map((action) => ({
		id: generateId(),
		runId,
		kind: action.kind,
		payload: action.payload,
		idempotencyKey: action.idempotencyKey,
	}));
	const inserted = await db
		.insert(runActions)
		.values(rows)
		.onConflictDoNothing({
			target: [runActions.runId, runActions.idempotencyKey],
		})
		.returning({
			id: runActions.id,
			kind: runActions.kind,
			payload: runActions.payload,
		});
	return inserted.map((row) => ({
		id: row.id,
		kind: row.kind,
		payload: row.payload as Record<string, unknown>,
	}));
}

export async function markActionExecuted(
	db: Db,
	actionId: string,
	externalId: string | null,
): Promise<void> {
	await db
		.update(runActions)
		.set({ status: "executed", executedAt: new Date(), externalId })
		.where(eq(runActions.id, actionId));
}

export async function completeRun(
	db: Db,
	runId: string,
	verdict: Verdict,
): Promise<void> {
	await db
		.update(runs)
		.set({ status: "completed", verdict, completedAt: new Date() })
		.where(eq(runs.id, runId));
}

export async function pauseRun(db: Db, runId: string): Promise<void> {
	await db
		.update(runs)
		.set({ status: "paused", verdict: "needs_review" })
		.where(eq(runs.id, runId));
}

export async function getRunWithSteps(db: Db, runId: string) {
	const runRows = await db.select().from(runs).where(eq(runs.id, runId));
	const run = runRows[0];
	if (!run) {
		return null;
	}
	const steps = await db
		.select()
		.from(runSteps)
		.where(eq(runSteps.runId, runId))
		.orderBy(runSteps.startedAt);
	const actions = await db
		.select()
		.from(runActions)
		.where(eq(runActions.runId, runId));
	return { run, steps, actions };
}

export async function listRuns(
	db: Db,
	{ limit = 50 }: { limit?: number } = {},
) {
	return await db.select().from(runs).orderBy(desc(runs.id)).limit(limit);
}
