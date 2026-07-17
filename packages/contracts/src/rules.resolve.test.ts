import { describe, expect, test } from "bun:test";
import { RULE_CATALOG, resolveEffectiveRuleConfig } from "./rules.ts";

const minMerged = RULE_CATALOG.find((r) => r.ruleId === "min-merged-prs");
if (!minMerged) {
	throw new Error("fixture: min-merged-prs catalog entry missing");
}
// A rule that has never bumped (still @1) — the "already current" baseline.
const accountAge = RULE_CATALOG.find((r) => r.ruleId === "account-age");
if (!accountAge) {
	throw new Error("fixture: account-age catalog entry missing");
}

/**
 * §6 (b) upgrade policy — auto-advance when lossless, hold when the config can't
 * carry forward. This is the DB-free heart of the mechanism, used identically by
 * the worker (evaluation) and the web (the held indicator).
 */
describe("resolveEffectiveRuleConfig", () => {
	test("already at current ⇒ runs as pinned, not held", () => {
		const r = resolveEffectiveRuleConfig({
			ruleId: "min-merged-prs",
			version: minMerged.version,
			enabled: true,
			config: minMerged.defaultConfig,
		});
		expect(r).toEqual({
			ref: `min-merged-prs@${minMerged.version}`,
			enabled: true,
			config: minMerged.defaultConfig,
			held: false,
		});
	});

	test("pinned behind + config carries forward ⇒ AUTO-ADVANCE to current, not held", () => {
		const config = { min: 3, trustedAfter: 2 };
		const r = resolveEffectiveRuleConfig({
			ruleId: "min-merged-prs",
			version: 1,
			enabled: true,
			config,
		});
		expect(r).toEqual({
			ref: `min-merged-prs@${minMerged.version}`,
			enabled: true,
			config,
			held: false,
		});
	});

	test("pinned behind + config CANNOT parse under the new schema ⇒ HELD on the pinned version", () => {
		const r = resolveEffectiveRuleConfig({
			ruleId: "min-merged-prs",
			version: 1,
			enabled: true,
			config: null,
		});
		expect(r).toEqual({
			ref: "min-merged-prs@1",
			enabled: true,
			config: null,
			held: true,
		});
	});

	test("never-bumped rule ⇒ runs as pinned, never held", () => {
		const r = resolveEffectiveRuleConfig({
			ruleId: "account-age",
			version: accountAge.version,
			enabled: true,
			config: { minDays: 30 },
		});
		expect(r.held).toBe(false);
		expect(r.ref).toBe(`account-age@${accountAge.version}`);
	});

	test("unknown rule id ⇒ passthrough, never held", () => {
		const r = resolveEffectiveRuleConfig({
			ruleId: "not-a-rule",
			version: 1,
			enabled: false,
			config: {},
		});
		expect(r).toEqual({
			ref: "not-a-rule@1",
			enabled: false,
			config: {},
			held: false,
		});
	});
});
