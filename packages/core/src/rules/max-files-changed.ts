import { z } from "zod";
import { defineRule } from "./define.ts";

/**
 * max-files-changed@1 — the change request may touch at most `max` files.
 * The 4000-lines-of-vendored-code PR dies here.
 */
export const maxFilesChanged = defineRule({
	id: "max-files-changed",
	version: 1,
	configSchema: z.object({
		max: z.number().int().min(1),
	}),
	resultSchema: z.object({
		filesChanged: z.number(),
		max: z.number(),
	}),
	evaluate(ctx, config) {
		if (ctx.diff === null) {
			return { status: "skipped", reason: "diff unavailable" };
		}
		return {
			status: "evaluated",
			passed: ctx.diff.length <= config.max,
			evidence: { filesChanged: ctx.diff.length, max: config.max },
		};
	},
});
