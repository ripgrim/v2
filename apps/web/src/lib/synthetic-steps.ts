import type { JsonValue, RunStepView } from "#/lib/runs.functions";

/**
 * The two synthetic run-level steps the worker records outside the workflow
 * graph (VERIFICATION-QUEUE #11 — they must read distinctly, never like a
 * graph node): `run:deny-floor` (unit 5 — a maintainer deny with no deny edge
 * floors to block) and `run:degradation` (unit 1 — the fail-closed floor
 * routes a mostly-skipped run to review).
 */

export interface SyntheticStepView {
	kind: "deny-floor" | "degradation";
	title: string;
	detail: string;
}

function asRecord(value: JsonValue): { [key: string]: JsonValue } | null {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? value
		: null;
}

export function describeSyntheticStep(
	step: Pick<RunStepView, "nodeId" | "output">,
): SyntheticStepView | null {
	if (step.nodeId === "run:deny-floor") {
		return {
			kind: "deny-floor",
			title: "denied by maintainer",
			detail:
				"no deny edge drawn — the deny floor blocked this change by default. deny never fails open.",
		};
	}
	if (step.nodeId === "run:degradation") {
		const output = asRecord(step.output);
		const skipped = output?.skippedRules;
		const total = output?.ruleNodes;
		const counts =
			typeof skipped === "number" && typeof total === "number"
				? `${skipped} of ${total} rules skipped`
				: "rule evaluation degraded";
		const reads = output?.degradedReads;
		const readsSuffix =
			Array.isArray(reads) && reads.length > 0
				? ` (degraded reads: ${reads.filter((r) => typeof r === "string").join(", ")})`
				: "";
		return {
			kind: "degradation",
			title: "evaluation degraded",
			detail: `${counts}${readsSuffix} — the fail-closed floor sent this run to review instead of passing on guesswork.`,
		};
	}
	return null;
}
