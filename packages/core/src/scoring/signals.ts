/**
 * The ABSTRACT signal taxonomy (§4). Core knows four categories; platform
 * packages register NAMED signals into them — core never knows "sponsors"
 * exists. Missing categories are modeled: a barren Forgejo simply supplies no
 * signals for a category and the weight redistributes (graceful degradation).
 */

export const SIGNAL_CATEGORIES = [
	"identity-investment",
	"community-standing",
	"contribution-history",
	"red-flags",
] as const;
export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

export interface Signal {
	/** Platform-namespaced name, e.g. "github/sponsors". Core never inspects it. */
	name: string;
	category: SignalCategory;
	/**
	 * Normalized strength in [0, 1]. For `red-flags` this is severity — it
	 * only ever LOWERS the score.
	 */
	value: number;
}

/** Clamps into [0, 1] — adapters supply values, core defends the range. */
export function clampSignalValue(value: number): number {
	if (Number.isNaN(value)) {
		return 0;
	}
	return Math.min(1, Math.max(0, value));
}
