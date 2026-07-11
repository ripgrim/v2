import { z } from "zod";
import { defineRule } from "./define.ts";

/**
 * min-merged-prs@1 — the contributor must have at least `min` merged change
 * requests in the subject repo. Evidence: actual count vs the requirement.
 */
export const minMergedPrs = defineRule({
	id: "min-merged-prs",
	version: 1,
	configSchema: z.object({
		min: z.number().int().min(0),
	}),
	resultSchema: z.object({
		mergedInRepo: z.number(),
		min: z.number(),
	}),
	evaluate(ctx, config) {
		if (ctx.contributor === null) {
			return { status: "skipped", reason: "contributor profile unavailable" };
		}
		return {
			status: "evaluated",
			passed: ctx.contributor.mergedInRepo >= config.min,
			evidence: { mergedInRepo: ctx.contributor.mergedInRepo, min: config.min },
		};
	},
});
