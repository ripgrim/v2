import {
	clampSignalValue,
	type Signal,
	type SignalCategory,
} from "./signals.ts";

/**
 * 0–100 composition (§4). Positive categories average their signals and split
 * the positive weight equally among the categories that are PRESENT (missing
 * categories degrade gracefully instead of zeroing the score). Red flags only
 * subtract — the strongest flag sets the penalty. Deterministic by
 * construction: same signals ⇒ same score.
 */

const POSITIVE_CATEGORIES: SignalCategory[] = [
	"identity-investment",
	"community-standing",
	"contribution-history",
];

/** The strongest red flag can erase at most this many points. */
const RED_FLAG_MAX_PENALTY = 100;

export function score(signals: Signal[]): number {
	const byCategory = new Map<SignalCategory, number[]>();
	for (const signal of signals) {
		const list = byCategory.get(signal.category) ?? [];
		list.push(clampSignalValue(signal.value));
		byCategory.set(signal.category, list);
	}

	const present = POSITIVE_CATEGORIES.filter(
		(category) => (byCategory.get(category)?.length ?? 0) > 0,
	);
	let positive = 0;
	if (present.length > 0) {
		const weight = 1 / present.length;
		for (const category of present) {
			const values = byCategory.get(category) as number[];
			const mean = values.reduce((a, b) => a + b, 0) / values.length;
			positive += mean * weight;
		}
	}

	const flags = byCategory.get("red-flags") ?? [];
	const worstFlag = flags.length > 0 ? Math.max(...flags) : 0;
	const raw = positive * 100 - worstFlag * RED_FLAG_MAX_PENALTY;
	return Math.min(100, Math.max(0, Math.round(raw)));
}
