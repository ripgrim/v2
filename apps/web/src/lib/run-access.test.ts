import { describe, expect, test } from "bun:test";
import {
	isPublicPath,
	resolveRunAccess,
	toPublicRunView,
} from "#/lib/run-access";
import type { RunStepView, RunView } from "#/lib/runs.functions";

/** §10 access model — public read of the judgment, gated everything else. */

describe("resolveRunAccess", () => {
	test("open-dev posture (auth disabled) ⇒ full", () => {
		expect(
			resolveRunAccess({
				authEnabled: false,
				hasSession: false,
				repoPrivate: true,
			}),
		).toBe("full");
	});

	test("session ⇒ full, regardless of repo visibility", () => {
		expect(
			resolveRunAccess({
				authEnabled: true,
				hasSession: true,
				repoPrivate: true,
			}),
		).toBe("full");
	});

	test("no session + public repo ⇒ public view", () => {
		expect(
			resolveRunAccess({
				authEnabled: true,
				hasSession: false,
				repoPrivate: false,
			}),
		).toBe("public");
	});

	test("no session + private repo ⇒ denied", () => {
		expect(
			resolveRunAccess({
				authEnabled: true,
				hasSession: false,
				repoPrivate: true,
			}),
		).toBe("denied");
	});

	test("no session + unknown visibility ⇒ denied (fail closed)", () => {
		expect(
			resolveRunAccess({
				authEnabled: true,
				hasSession: false,
				repoPrivate: null,
			}),
		).toBe("denied");
	});
});

describe("isPublicPath", () => {
	test("the run page and /login are public", () => {
		expect(isPublicPath("/login")).toBe(true);
		expect(isPublicPath("/runs/019f54d3-0c13-7000-930a-dc97f87e1d5e")).toBe(
			true,
		);
		expect(isPublicPath("/runs/019f54d3-0c13-7000-930a-dc97f87e1d5e/")).toBe(
			true,
		);
	});

	test("list and index routes stay gated (redirect to /login)", () => {
		for (const path of [
			"/",
			"/events",
			"/moderation",
			"/rules",
			"/workflows",
			"/analytics",
			"/runs",
			"/runs/",
			"/runs/abc/steps",
		]) {
			expect(isPublicPath(path)).toBe(false);
		}
	});
});

const aiReviewStep: RunStepView = {
	id: "step-2",
	nodeId: "default@1:ai-review-1",
	nodeKind: "rule",
	ruleRef: "ai-review@1",
	status: "failed",
	evidence: {
		ruleId: "ai-review",
		version: 1,
		status: "evaluated",
		passed: false,
		evaluatedAt: "2026-07-11T00:00:00.000Z",
		evidence: {
			output: {
				verdict: "block",
				confidence: 1,
				summary: "exfiltrates tokens in ci.",
				findings: [
					{
						severity: "critical",
						file: ".github/workflows/ci.yml",
						line: 12,
						note: "posts secrets to an external host",
					},
				],
			},
			trace: { steps: 4, tokens: 9000, messages: ["internal"] },
		},
	},
	output: null,
	durationMs: 1200,
	startedAt: "2026-07-11T00:00:00.000Z",
};

const ruleStep: RunStepView = {
	id: "step-1",
	nodeId: "default@1:account-age-1",
	nodeKind: "rule",
	ruleRef: "account-age@1",
	status: "failed",
	evidence: {
		ruleId: "account-age",
		version: 1,
		status: "evaluated",
		passed: false,
		evaluatedAt: "2026-07-11T00:00:00.000Z",
		evidence: { accountAgeDays: 1, minDays: 30 },
	},
	output: null,
	durationMs: 3,
	startedAt: "2026-07-11T00:00:00.000Z",
};

const fullView: RunView = {
	id: "run-1",
	repoFullName: "acme/pub",
	subjectNumber: 7,
	headSha: "abc1234def",
	status: "completed",
	verdict: "block",
	createdAt: "2026-07-11T00:00:00.000Z",
	completedAt: "2026-07-11T00:00:01.000Z",
	snapshot: [{ id: "default@1" }],
	access: "full",
	steps: [ruleStep, aiReviewStep],
	actions: [
		{
			kind: "block",
			status: "executed",
			recordedAt: "2026-07-11T00:00:01.000Z",
		},
	],
};

describe("toPublicRunView", () => {
	const publicView = toPublicRunView(fullView);

	test("keeps the verdict, rule evidence and ai-review findings", () => {
		expect(publicView.access).toBe("public");
		expect(publicView.verdict).toBe("block");
		expect(publicView.steps[0]).toEqual(ruleStep);
		const aiEvidence = publicView.steps[1]?.evidence as {
			evidence: { output: { findings: unknown[] }; trace?: unknown };
		};
		expect(aiEvidence.evidence.output.findings).toHaveLength(1);
	});

	test("omits the ai-review raw trace and the workflow snapshot", () => {
		expect(JSON.stringify(publicView)).not.toContain("trace");
		expect(publicView.snapshot).toBeNull();
	});

	test("does not mutate the full view", () => {
		expect(JSON.stringify(fullView)).toContain("trace");
		expect(fullView.access).toBe("full");
	});
});
