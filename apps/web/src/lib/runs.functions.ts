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
	/** Workflow definitions as stored (JSON); null on the public view (§10). */
	snapshot: JsonValue;
	/** §10 — "public" renders the no-session view (footer, no trace). */
	access: "full" | "public";
	steps: RunStepView[];
	actions: { kind: string; status: string; recordedAt: string }[];
}

/**
 * §10 — this is the ONE server function readable without a session: the run
 * page is unlisted-public so blocked contributors can read the judgment.
 * Access shaping (public view, private-repo denial) lives in loadRunView.
 */
export const getRun = createServerFn({ method: "GET" })
	.inputValidator((input: { runId: string }) => input)
	.handler(async ({ data }): Promise<RunView | null> => {
		const { loadRunView } = await import("#/lib/server/run-view");
		const { readSessionState } = await import("#/lib/server/session");
		const { getDb } = await import("#/lib/server/db");
		return await loadRunView(getDb().db, data.runId, await readSessionState());
	});
