import { describe, expect, test } from "bun:test";
import { describeSyntheticStep } from "#/lib/synthetic-steps";

/** VERIFICATION-QUEUE #11 — synthetic steps must read distinctly. */

describe("describeSyntheticStep", () => {
	test("run:deny-floor says a maintainer denied it and why it blocked", () => {
		const view = describeSyntheticStep({
			nodeId: "run:deny-floor",
			output: { rule: "deny (no deny edge) → block by default" },
		});
		expect(view?.kind).toBe("deny-floor");
		expect(view?.title).toBe("denied by maintainer");
		expect(view?.detail).toContain("no deny edge drawn");
	});

	test("run:degradation surfaces the skipped ratio and degraded reads", () => {
		const view = describeSyntheticStep({
			nodeId: "run:degradation",
			output: {
				degradedReads: ["getContributorProfile"],
				skippedRules: 2,
				ruleNodes: 3,
			},
		});
		expect(view?.kind).toBe("degradation");
		expect(view?.title).toBe("evaluation degraded");
		expect(view?.detail).toContain("2 of 3 rules skipped");
		expect(view?.detail).toContain("getContributorProfile");
	});

	test("run:degradation stays honest when output is malformed", () => {
		const view = describeSyntheticStep({
			nodeId: "run:degradation",
			output: null,
		});
		expect(view?.detail).toContain("rule evaluation degraded");
	});

	test("ordinary graph nodes are not synthetic", () => {
		for (const nodeId of [
			"default@1:account-age-1",
			"default@1:send-to-moderation-1",
			"run:deny-floor:resume",
		]) {
			expect(describeSyntheticStep({ nodeId, output: null })).toBeNull();
		}
	});
});
