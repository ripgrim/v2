import type { JsonValue, RunStepView, RunView } from "#/lib/runs.functions";

/**
 * §10 access model — viewing is public, deciding is gated. `/runs/{id}` is
 * unlisted-public (gist-style, unguessable UUIDv7) so a blocked contributor
 * can read the judgment; everything mutating or list-shaped stays behind a
 * session. Pure decisions live here so the policy is unit-testable.
 */

export type RunAccess = "full" | "public" | "denied";

export interface RunAccessInput {
	/** false in open-dev posture (resolveAuthPosture) — the gate stands open. */
	authEnabled: boolean;
	hasSession: boolean;
	/**
	 * Repo visibility from installation sync; null when the repo row is
	 * missing or unresolved — treated as private (fail closed).
	 */
	repoPrivate: boolean | null;
}

export function resolveRunAccess({
	authEnabled,
	hasSession,
	repoPrivate,
}: RunAccessInput): RunAccess {
	if (!authEnabled || hasSession) {
		return "full";
	}
	return repoPrivate === false ? "public" : "denied";
}

const PUBLIC_RUN_PATH = /^\/runs\/[^/]+\/?$/;

/**
 * Routes reachable without a session: /login and the single run page. Run
 * LISTS and every other index route stay behind the root redirect — a
 * crawlable index of verdicts must not exist (§10).
 */
export function isPublicPath(pathname: string): boolean {
	return pathname === "/login" || PUBLIC_RUN_PATH.test(pathname);
}

function isJsonRecord(value: JsonValue): value is { [key: string]: JsonValue } {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The public view keeps the ai-review FINDINGS (verdict, summary, findings)
 * but drops the raw trace — tool calls, tokens and prompt flow are internals
 * and mildly aid evasion (§10). Rule steps duplicate the envelope in `output`,
 * so both fields are sanitized.
 */
function stripAiReviewTrace(step: RunStepView): RunStepView {
	if (!step.ruleRef?.startsWith("ai-review@")) {
		return step;
	}
	const envelope = step.evidence;
	if (!isJsonRecord(envelope)) {
		return step;
	}
	const inner = envelope.evidence;
	if (inner === undefined || !isJsonRecord(inner)) {
		return step;
	}
	const { trace: _trace, ...keptEvidence } = inner;
	const sanitized: JsonValue = { ...envelope, evidence: keptEvidence };
	return { ...step, evidence: sanitized, output: sanitized };
}

/**
 * Public render of a run: verdict, per-rule steps, rule evidence and
 * ai-review findings — no ai-review trace, no workflow snapshot (repo
 * configuration internals).
 */
export function toPublicRunView(view: RunView): RunView {
	return {
		...view,
		access: "public",
		snapshot: null,
		steps: view.steps.map(stripAiReviewTrace),
	};
}
