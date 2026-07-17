import type { RuleContext } from "@tripwire/core";
import { describe, expect, test } from "bun:test";
import pino from "pino";
import { isRunDegraded, makeEvaluator } from "./run-workflows.ts";

const logger = pino({ level: "silent" });

/**
 * §6 fail-closed floor — a would-be pass with too much skipped evaluation goes to
 * moderation, not through. Both sides of the 50% line, plus the "only escalates a
 * pass" rule. This is the AI-outage safety net (key revoked / OpenRouter down ⇒
 * ai-review skips): under the floor a contributor still passes, at the floor a
 * human looks.
 */
describe("isRunDegraded (fail-closed floor)", () => {
	test("AT the floor (>=50% skipped) escalates a pass to review", () => {
		expect(isRunDegraded(2, 1, "pass")).toBe(true); // 1 of 2
		expect(isRunDegraded(4, 2, "pass")).toBe(true); // 2 of 4
		expect(isRunDegraded(1, 1, "pass")).toBe(true); // ai-review alone, skipped
		expect(isRunDegraded(3, 3, "pass")).toBe(true); // all skipped
	});

	test("JUST UNDER the floor (<50% skipped) still passes", () => {
		expect(isRunDegraded(3, 1, "pass")).toBe(false); // 1 of 3
		expect(isRunDegraded(4, 1, "pass")).toBe(false); // 1 of 4
		expect(isRunDegraded(2, 0, "pass")).toBe(false); // nothing skipped
	});

	test("only escalates a pass — a block/needs_review stays as-is", () => {
		expect(isRunDegraded(2, 2, "block")).toBe(false);
		expect(isRunDegraded(2, 2, "needs_review")).toBe(false);
	});

	test("no rule nodes ⇒ not degraded", () => {
		expect(isRunDegraded(0, 0, "pass")).toBe(false);
	});
});

/** A change-request context whose injected generate throws (429 / timeout). */
function throwingContext(): RuleContext {
	return {
		event: {
			kind: "change-request.opened",
			id: "1",
			forge: "github",
			deliveryId: "d",
			repo: { fullName: "octo/repo", private: false },
			actor: { login: "stranger" },
			changeRequest: {
				number: 1,
				title: "add feature",
				headSha: "abc123",
				baseRef: "main",
				headRef: "feature",
				draft: false,
				url: "https://example.com/pr/1",
			},
			occurredAt: "2026-01-01T00:00:00.000Z",
			receivedAt: "2026-01-01T00:00:00.000Z",
		},
		now: "2026-01-01T00:00:00.000Z",
		diff: [
			{ path: "a.ts", status: "modified", additions: 1, deletions: 0, patch: "+x" },
		],
		commits: null,
		contributor: null,
		generate: () => {
			throw new Error("openrouter 429 rate limited");
		},
	} as unknown as RuleContext;
}

describe("makeEvaluator — a thrown generate() degrades to skipped (429/timeout class)", () => {
	test("ai-review whose generate throws becomes a skipped step, not a crash", async () => {
		const evaluate = makeEvaluator(throwingContext(), logger);
		const result = await evaluate("ai-review@2", { maxSteps: 12 });
		expect(result.status).toBe("skipped");
		expect(result.passed).toBe(false);
		expect(result.reason).toContain("rule threw");
	});
});
