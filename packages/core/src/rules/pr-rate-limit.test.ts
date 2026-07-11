import { describe, expect, test } from "bun:test";
import { evaluateRule } from "./define.ts";
import { prRateLimit } from "./pr-rate-limit.ts";
import {
	FIXTURE_NOW,
	fixtureContext,
	fixtureContributor,
} from "./test-context.ts";

function minutesAgo(minutes: number): string {
	return new Date(Date.parse(FIXTURE_NOW) - minutes * 60_000).toISOString();
}

describe("pr-rate-limit@1", () => {
	test("passes under the window limit", async () => {
		const ctx = await fixtureContext({
			contributor: fixtureContributor({
				recentChangeRequestTimes: [minutesAgo(10), minutesAgo(300)],
			}),
		});
		const result = await evaluateRule(prRateLimit, ctx, {
			maxPerWindow: 5,
			windowHours: 24,
		});
		expect(result.passed).toBe(true);
		expect(result.evidence).toMatchObject({ count: 2, maxPerWindow: 5 });
	});

	test("blocks a burst and reports the spray CoV", async () => {
		const ctx = await fixtureContext({
			contributor: fixtureContributor({
				recentChangeRequestTimes: [
					minutesAgo(2),
					minutesAgo(4),
					minutesAgo(6),
					minutesAgo(8),
					minutesAgo(10),
					minutesAgo(12),
				],
			}),
		});
		const result = await evaluateRule(prRateLimit, ctx, {
			maxPerWindow: 3,
			windowHours: 1,
		});
		expect(result.passed).toBe(false);
		const evidence = result.evidence as { count: number; intervalCov: number };
		expect(evidence.count).toBe(6);
		expect(evidence.intervalCov).toBeCloseTo(0, 5);
	});

	test("old activity outside the window does not count", async () => {
		const ctx = await fixtureContext({
			contributor: fixtureContributor({
				recentChangeRequestTimes: [minutesAgo(60 * 48), minutesAgo(60 * 72)],
			}),
		});
		const result = await evaluateRule(prRateLimit, ctx, {
			maxPerWindow: 1,
			windowHours: 24,
		});
		expect(result.passed).toBe(true);
		expect(result.evidence).toMatchObject({ count: 0 });
	});

	test("skips without a contributor profile", async () => {
		const result = await evaluateRule(
			prRateLimit,
			await fixtureContext({ contributor: null }),
			{ maxPerWindow: 3, windowHours: 24 },
		);
		expect(result.status).toBe("skipped");
	});
});
