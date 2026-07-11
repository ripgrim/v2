import { describe, expect, test } from "bun:test";
import { normalizedEventSchema, type RuleResult } from "@tripwire/contracts";
import { executeWorkflow, validateWorkflow } from "@tripwire/core";

/**
 * §13.10 round-trip proof: the editor's emission (a committed artifact
 * produced by `apps/web/src/lib/workflow-editor.ts#graphToDefinition`, see
 * fixtures/editor-output.workflow.json) → core validate.ts → executor. The
 * editor emits the same JSON the engine has eaten since step 6.
 */
describe("editor output → validate.ts → executor", () => {
	test("validates and executes to a verdict", async () => {
		const emission = await Bun.file(
			new URL("../fixtures/editor-output.workflow.json", import.meta.url)
				.pathname,
		).json();
		const validated = validateWorkflow(emission);
		expect(validated.valid).toBe(true);
		if (!validated.valid) {
			return;
		}

		const event = normalizedEventSchema.parse(
			await Bun.file(
				new URL(
					"../../../packages/core/fixtures/change-request.opened.event.json",
					import.meta.url,
				).pathname,
			).json(),
		);

		const result = await executeWorkflow({
			definition: validated.definition,
			event,
			evaluateRuleRef: (ref: string): Promise<RuleResult> =>
				Promise.resolve({
					ruleId: ref.split("@")[0] as string,
					version: 1,
					status: "evaluated",
					passed: ref !== "account-age@1",
					evidence: {},
					evaluatedAt: "2026-07-11T00:00:00.000Z",
				}),
			now: () => new Date().toISOString(),
		});
		expect(result.verdict).toBe("block");
		expect(result.steps.length).toBeGreaterThanOrEqual(9);
	});
});
