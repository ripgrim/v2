import { z } from "zod";

/**
 * Check domain (spec §7, contract defined verbatim there) — the merge-gate
 * state Tripwire emits through the forge's native check primitive. One check
 * run named `tripwire` per head SHA; `pending` is emitted as soon as the
 * worker picks up the event so the merge button is held DURING evaluation.
 */
export const checkConclusionSchema = z.enum([
	"success",
	"failure",
	"neutral",
	"pending",
]);
export type CheckConclusion = z.infer<typeof checkConclusionSchema>;

export const checkStateSchema = z.object({
	sha: z.string(),
	conclusion: checkConclusionSchema,
	summary: z.string(),
	detailsUrl: z.string(),
});
export type CheckState = z.infer<typeof checkStateSchema>;
