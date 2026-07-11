import { describe, expect, test } from "bun:test";
import { evaluateRule } from "./define.ts";
import { honeypot } from "./honeypot.ts";
import { fixtureContext, fixtureDiff } from "./test-context.ts";

describe("honeypot@1", () => {
	test("passes when no honeypot path is touched", async () => {
		const ctx = await fixtureContext({
			diff: fixtureDiff([{ path: "src/app.ts" }]),
		});
		const result = await evaluateRule(honeypot, ctx, {
			paths: [".github/workflows/**", "scripts/release*"],
		});
		expect(result.passed).toBe(true);
		expect(result.evidence).toEqual({ touched: [] });
	});

	test("blocks workflow tampering", async () => {
		const ctx = await fixtureContext({
			diff: fixtureDiff([
				{ path: ".github/workflows/ci.yml" },
				{ path: "src/app.ts" },
			]),
		});
		const result = await evaluateRule(honeypot, ctx, {
			paths: [".github/workflows/**"],
		});
		expect(result.passed).toBe(false);
		expect(result.evidence).toEqual({
			touched: [".github/workflows/ci.yml"],
		});
	});

	test("single-star does not span directories; double-star does", async () => {
		const ctx = await fixtureContext({
			diff: fixtureDiff([{ path: "scripts/nested/release.sh" }]),
		});
		const single = await evaluateRule(honeypot, ctx, {
			paths: ["scripts/*.sh"],
		});
		expect(single.passed).toBe(true);
		const double = await evaluateRule(honeypot, ctx, {
			paths: ["scripts/**"],
		});
		expect(double.passed).toBe(false);
	});

	test("skips when the diff read was unavailable", async () => {
		const result = await evaluateRule(
			honeypot,
			await fixtureContext({ diff: null }),
			{ paths: [".github/workflows/**"] },
		);
		expect(result.status).toBe("skipped");
	});
});
