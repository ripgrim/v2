import { describe, expect, test } from "bun:test";
import { RULE_CATALOG } from "@tripwire/contracts";
import { resolveRuleUpgrade } from "./rule-upgrade.ts";

const minMerged = RULE_CATALOG.find((r) => r.ruleId === "min-merged-prs");
if (!minMerged) {
	throw new Error("fixture: min-merged-prs catalog entry missing");
}

/**
 * §6 (b) — moving a repo to a newer rule version is an explicit admin action.
 * These lock the re-pin/no-op/config-carry decision (the DB-free half of the
 * `upgradeRuleConfig` server fn).
 */
describe("resolveRuleUpgrade", () => {
	test("no-op when nothing is pinned (unconfigured repo already runs current)", () => {
		expect(resolveRuleUpgrade(undefined, minMerged)).toBeNull();
	});

	test("no-op when already at the current version", () => {
		expect(
			resolveRuleUpgrade(
				{
					version: minMerged.version,
					enabled: true,
					config: minMerged.defaultConfig,
				},
				minMerged,
			),
		).toBeNull();
	});

	test("re-pins to current and carries a still-valid config forward", () => {
		const config = { min: 3, trustedAfter: 2 };
		expect(
			resolveRuleUpgrade({ version: 1, enabled: true, config }, minMerged),
		).toEqual({ version: minMerged.version, enabled: true, config });
	});

	test("falls back to the new default when the pinned config no longer parses", () => {
		expect(
			resolveRuleUpgrade(
				{ version: 1, enabled: false, config: null },
				minMerged,
			),
		).toEqual({
			version: minMerged.version,
			enabled: false,
			config: minMerged.defaultConfig,
		});
	});
});
