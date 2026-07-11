import { describe, expect, test } from "bun:test";
import { evaluateRule } from "./define.ts";
import { minMergedPrs } from "./min-merged-prs.ts";
import { fixtureContext, fixtureContributor } from "./test-context.ts";

describe("min-merged-prs@1", () => {
	test("passes at or above the threshold", async () => {
		const ctx = await fixtureContext({
			contributor: fixtureContributor({ mergedInRepo: 3 }),
		});
		const result = await evaluateRule(minMergedPrs, ctx, { min: 3 });
		expect(result.passed).toBe(true);
		expect(result.evidence).toEqual({ mergedInRepo: 3, min: 3 });
	});

	test("blocks below the threshold", async () => {
		const ctx = await fixtureContext({
			contributor: fixtureContributor({ mergedInRepo: 0 }),
		});
		const result = await evaluateRule(minMergedPrs, ctx, { min: 1 });
		expect(result.passed).toBe(false);
	});

	test("skips without a contributor profile", async () => {
		const result = await evaluateRule(
			minMergedPrs,
			await fixtureContext({ contributor: null }),
			{ min: 1 },
		);
		expect(result.status).toBe("skipped");
	});
});
