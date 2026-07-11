import { createServerFn } from "@tanstack/react-start";
import type { Verdict } from "@tripwire/contracts";

/** Serializable JSON — evidence/output cross the server-fn boundary as JSON. */
export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

export interface RunStepView {
	id: string;
	nodeId: string;
	nodeKind: string;
	ruleRef: string | null;
	status: string;
	evidence: JsonValue;
	output: JsonValue;
	durationMs: number;
	startedAt: string;
}

export interface RunView {
	id: string;
	repoFullName: string;
	subjectNumber: number | null;
	headSha: string | null;
	status: string;
	verdict: Verdict | null;
	createdAt: string;
	completedAt: string | null;
	/** Workflow definitions as stored (JSON). */
	snapshot: JsonValue;
	steps: RunStepView[];
	actions: { kind: string; status: string; recordedAt: string }[];
}

export const getRun = createServerFn({ method: "GET" })
	.inputValidator((input: { runId: string }) => input)
	.handler(async ({ data }): Promise<RunView | null> => {
		const { runServices } = await import("@tripwire/db");
		const { getDb } = await import("#/lib/server/db");
		const result = await runServices.getRunWithSteps(getDb().db, data.runId);
		if (!result) {
			return null;
		}
		return {
			id: result.run.id,
			repoFullName: result.run.repoFullName,
			subjectNumber: result.run.subjectNumber,
			headSha: result.run.headSha,
			status: result.run.status,
			verdict: result.run.verdict as Verdict | null,
			createdAt: result.run.createdAt.toISOString(),
			completedAt: result.run.completedAt?.toISOString() ?? null,
			snapshot: result.run.workflowSnapshot as JsonValue,
			steps: result.steps.map((step) => ({
				id: step.id,
				nodeId: step.nodeId,
				nodeKind: step.nodeKind,
				ruleRef: step.ruleId,
				status: step.status,
				evidence: step.evidence as JsonValue,
				output: step.output as JsonValue,
				durationMs: step.durationMs,
				startedAt: step.startedAt.toISOString(),
			})),
			actions: result.actions.map((action) => ({
				kind: action.kind,
				status: action.status,
				recordedAt: action.recordedAt.toISOString(),
			})),
		};
	});
