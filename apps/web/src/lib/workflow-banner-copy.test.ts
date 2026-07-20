import { describe, expect, test } from "bun:test";
import { workflowBannerCopy } from "./workflow-banner-copy";

describe("workflowBannerCopy", () => {
	test("names a single owned rule", () => {
		expect(workflowBannerCopy(["account age"])).toBe(
			"Your workflow runs account age. Every other rule runs on its own toggle.",
		);
	});

	test("names two with 'and'", () => {
		expect(workflowBannerCopy(["account age", "crypto address"])).toBe(
			"Your workflow runs account age and crypto address. Every other rule runs on its own toggle.",
		);
	});

	test("names three with an oxford comma", () => {
		expect(
			workflowBannerCopy(["account age", "crypto address", "honeypot paths"]),
		).toBe(
			"Your workflow runs account age, crypto address, and honeypot paths. Every other rule runs on its own toggle.",
		);
	});

	test("keeps the first three names then counts the rest", () => {
		expect(
			workflowBannerCopy([
				"account age",
				"crypto address",
				"honeypot paths",
				"rate limit",
				"english only",
			]),
		).toBe(
			"Your workflow runs account age, crypto address, honeypot paths, and 2 more. Every other rule runs on its own toggle.",
		);
	});

	test("a workflow that owns no catalog rules", () => {
		expect(workflowBannerCopy([])).toBe(
			"Your workflow doesn't run any rules yet. Every rule below runs on its own toggle.",
		);
	});

	test("copy carries no em dashes (global copy rule)", () => {
		const all = [
			workflowBannerCopy([]),
			workflowBannerCopy(["account age"]),
			workflowBannerCopy(["a", "b", "c", "d"]),
		];
		for (const line of all) {
			expect(line).not.toContain("—");
		}
	});
});
