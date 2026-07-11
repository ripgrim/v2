import { describe, expect, test } from "bun:test";
import { evaluateRule } from "./define.ts";
import { englishOnly } from "./english-only.ts";
import { fixtureContext, fixtureEvent } from "./test-context.ts";

describe("english-only@1", () => {
	test("passes a latin-script title (captured fixture)", async () => {
		const result = await evaluateRule(englishOnly, await fixtureContext(), {
			maxNonLatinRatio: 0.5,
		});
		expect(result.status).toBe("evaluated");
		expect(result.passed).toBe(true);
	});

	test("blocks a predominantly non-latin comment", async () => {
		const event = await fixtureEvent("comment.created.event");
		if (event.kind !== "comment.created") {
			throw new Error("wrong fixture");
		}
		const ctx = await fixtureContext({
			event: {
				...event,
				comment: { ...event.comment, body: "これは完全に日本語のコメントです" },
			},
		});
		const result = await evaluateRule(englishOnly, ctx, {
			maxNonLatinRatio: 0.5,
		});
		expect(result.passed).toBe(false);
		const evidence = result.evidence as { ratio: number };
		expect(evidence.ratio).toBeGreaterThan(0.9);
	});

	test("skips when there is nothing to judge", async () => {
		const event = await fixtureEvent("comment.created.event");
		if (event.kind !== "comment.created") {
			throw new Error("wrong fixture");
		}
		const ctx = await fixtureContext({
			event: { ...event, comment: { ...event.comment, body: "+1 🚀" } },
		});
		const result = await evaluateRule(englishOnly, ctx, {
			maxNonLatinRatio: 0.5,
		});
		expect(result.status).toBe("skipped");
	});
});
