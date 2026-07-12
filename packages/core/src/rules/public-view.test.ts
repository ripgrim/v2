import { describe, expect, test } from "bun:test";
import type { z } from "zod";
import {
	listRules,
	PUBLIC_VIEW_OPT_OUT,
	projectRulePublic,
} from "./registry.ts";

/**
 * §10 public partition — the LEAK INVARIANT. A rule's public evidence must
 * never carry a configured-threshold field: those are the maintainer's tuning
 * (repo internals), not the contributor's facts. Driven over the whole
 * registry so a FUTURE rule can't leak its threshold just by existing.
 */

/** Representative evidence per rule — observed fields AND thresholds present, */
/** so the test proves the thresholds are dropped, not merely absent. */
const SAMPLE_EVIDENCE: Record<string, Record<string, unknown>> = {
	"account-age": { accountAgeDays: 2038, minDays: 7 },
	"min-merged-prs": { mergedInRepo: 3, min: 5 },
	"pr-rate-limit": {
		count: 2,
		maxPerWindow: 1,
		windowHours: 24,
		intervalCov: null,
	},
	"max-files-changed": { filesChanged: 2, max: 200 },
	"english-only": { ratio: 0.5, lettersExamined: 10, sample: "修复: fix" },
	"crypto-address": {
		matches: [{ kind: "eth", value: "0xAb58", location: "DONATE.md" }],
	},
	honeypot: { touched: [".github/workflows/exfil.yml"] },
	"profile-readme": { hasProfileText: true, length: 24, minLength: 32 },
	"ai-review": {
		output: { verdict: "block", confidence: 1, summary: "slop.", findings: [] },
		trace: { steps: 4, tokens: 9000, model: "x" },
	},
};

function configKeys(schema: z.ZodType): string[] {
	const shape = (schema as unknown as { shape?: Record<string, unknown> })
		.shape;
	return shape ? Object.keys(shape) : [];
}

describe("§10 public partition", () => {
	test("every registry rule defines both members or opts out with a reason", () => {
		for (const { rule } of listRules()) {
			const hasBoth = Boolean(rule.publicEvidence && rule.summarize);
			const optedOut = rule.id in PUBLIC_VIEW_OPT_OUT;
			if (!(hasBoth || optedOut)) {
				throw new Error(
					`rule ${rule.id} defines neither a public partition nor an opt-out reason`,
				);
			}
			if (optedOut) {
				expect(PUBLIC_VIEW_OPT_OUT[rule.id]?.length ?? 0).toBeGreaterThan(0);
			}
		}
	});

	test("LEAK INVARIANT: no configured-threshold field appears in public evidence", () => {
		for (const { ref, rule } of listRules()) {
			if (rule.id in PUBLIC_VIEW_OPT_OUT) {
				continue;
			}
			const sample = SAMPLE_EVIDENCE[rule.id];
			if (!sample) {
				throw new Error(`no SAMPLE_EVIDENCE for ${rule.id} — add one`);
			}
			const { publicEvidence } = projectRulePublic(ref, sample);
			const serialized = JSON.stringify(publicEvidence);
			for (const key of configKeys(rule.configSchema)) {
				expect(serialized).not.toContain(`"${key}"`);
			}
		}
	});

	test("ai-review keeps findings/summary but drops the raw trace", () => {
		const { publicEvidence, summary } = projectRulePublic(
			"ai-review@1",
			SAMPLE_EVIDENCE["ai-review"],
		);
		const serialized = JSON.stringify(publicEvidence);
		expect(serialized).toContain("findings");
		expect(serialized).not.toContain("trace");
		expect(summary).toBe("slop.");
	});

	test("observed values survive; one-liners read in constitution voice", () => {
		const age = projectRulePublic(
			"account-age@1",
			SAMPLE_EVIDENCE["account-age"],
		);
		expect(age.publicEvidence).toEqual({ accountAgeDays: 2038 });
		expect(age.summary).toBe("this account is 2038 days old");

		const crypto = projectRulePublic(
			"crypto-address@1",
			SAMPLE_EVIDENCE["crypto-address"],
		);
		expect(crypto.summary).toBe("found 1 crypto address in DONATE.md");
	});

	test("skipped evidence (null) projects to nothing — safe by default", () => {
		expect(projectRulePublic("account-age@1", null)).toEqual({
			publicEvidence: null,
			summary: null,
		});
	});
});
