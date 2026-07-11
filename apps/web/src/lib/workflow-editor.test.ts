import { describe, expect, test } from "bun:test";
import {
	DEFAULT_WORKFLOW,
	workflowDefinitionSchema,
} from "@tripwire/contracts";
import { definitionToGraph, graphToDefinition } from "./workflow-editor.ts";

describe("workflow editor round-trip", () => {
	test("definition → graph → definition is identity (mod layout)", () => {
		const graph = definitionToGraph(DEFAULT_WORKFLOW);
		const result = graphToDefinition(
			{
				id: DEFAULT_WORKFLOW.id,
				name: DEFAULT_WORKFLOW.name,
				version: DEFAULT_WORKFLOW.version,
			},
			graph.nodes,
			graph.edges,
		);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.definition).toEqual(DEFAULT_WORKFLOW);
		}
	});

	test("the emission parses against the contract schema", () => {
		const graph = definitionToGraph(DEFAULT_WORKFLOW);
		const result = graphToDefinition(
			{ id: "w", name: "w", version: 1 },
			graph.nodes,
			graph.edges,
		);
		if (!result.ok) {
			throw new Error(result.error);
		}
		expect(() =>
			workflowDefinitionSchema.parse(result.definition),
		).not.toThrow();
	});

	test("a broken graph (edge without nodes) is rejected at emission", () => {
		const result = graphToDefinition(
			{ id: "w", name: "w", version: 1 },
			[],
			[{ id: "e", source: "a", target: "b" }],
		);
		expect(result.ok).toBe(false);
	});
});
