import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { score } from "./score.ts";
import { SIGNAL_CATEGORIES, type Signal } from "./signals.ts";

const signalArb: fc.Arbitrary<Signal> = fc.record({
	name: fc.string({ minLength: 1, maxLength: 24 }),
	category: fc.constantFrom(...SIGNAL_CATEGORIES),
	value: fc.double({ min: 0, max: 1, noNaN: true }),
});

describe("score — §11 property tests", () => {
	test("score ∈ [0, 100] for any signal set", () => {
		fc.assert(
			fc.property(fc.array(signalArb, { maxLength: 40 }), (signals) => {
				const s = score(signals);
				return s >= 0 && s <= 100 && Number.isInteger(s);
			}),
		);
	});

	test("red flags never raise the score", () => {
		fc.assert(
			fc.property(
				fc.array(signalArb, { maxLength: 20 }),
				fc.double({ min: 0, max: 1, noNaN: true }),
				(signals, severity) => {
					const positiveOnly = signals.filter(
						(s) => s.category !== "red-flags",
					);
					const withFlag = [
						...positiveOnly,
						{ name: "flag", category: "red-flags" as const, value: severity },
					];
					return score(withFlag) <= score(positiveOnly);
				},
			),
		);
	});

	test("deterministic: same signals ⇒ same score", () => {
		fc.assert(
			fc.property(fc.array(signalArb, { maxLength: 40 }), (signals) => {
				const first = score(signals);
				const second = score([...signals]);
				return first === second;
			}),
		);
	});

	test("missing categories degrade gracefully (a barren forge still scores)", () => {
		const only = score([
			{ name: "x/history", category: "contribution-history", value: 1 },
		]);
		expect(only).toBe(100);
		expect(score([])).toBe(0);
	});

	test("out-of-range signal values are clamped, not amplified", () => {
		const s = score([
			{ name: "x", category: "community-standing", value: 999 },
		]);
		expect(s).toBe(100);
	});
});
