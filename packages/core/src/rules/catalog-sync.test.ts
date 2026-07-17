import { describe, expect, test } from "bun:test";
import { RULE_CATALOG } from "@tripwire/contracts";
import { getRule } from "./registry.ts";

/**
 * §6 (b) guard: the auto-advance policy resolves a repo to RULE_CATALOG's
 * CURRENT version (contracts), and the worker then evaluates that ref through
 * the engine registry (core). If the catalog's current version isn't registered,
 * an auto-advanced repo would silently skip the rule. This locks catalog current
 * ⊆ registry so the two can't drift apart.
 */
describe("RULE_CATALOG current versions are registered in the engine", () => {
	for (const entry of RULE_CATALOG) {
		test(`${entry.ruleId}@${entry.version} resolves in the registry`, () => {
			expect(getRule(`${entry.ruleId}@${entry.version}`)).not.toBeNull();
		});
	}
});
