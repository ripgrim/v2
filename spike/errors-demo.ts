// Raw error harvest: intentionally broken, excluded from spike/tsconfig.json.
// Compiled separately to capture the exact messages a user would see.
import {
	accountAge,
	defineForge,
	type GithubClient,
	matches,
	under,
} from "./fixture.ts";
import { rule, signals } from "./tripwire.config.github.ts";
import { signals as joeSignals } from "./tripwire.config.joe.ts";

// 1. Wrong comparison: matches() on a number signal.
export const wrongComparison = rule("bad", {
	when: signals.contributor.accountAge,
	comparison: matches(/x/),
	severity: "low",
});

// 2. Wrong comparison the other way: under() on a text signal.
export const wrongComparison2 = rule("bad", {
	when: signals.contributor.displayName,
	comparison: under(3),
	severity: "low",
});

// 3. Unsupported signal on the narrowed surface.
export const unsupported = joeSignals.contributor.accountAge;

// 4. Producer returning the wrong type for its signal.
export const badForge = defineForge<GithubClient>()({
	id: "bad",
	produces: {
		[accountAge.id]: async () => "not a number",
	},
});

// 5. The locked design's verbatim object key: [accountAge] as a computed
// property. Documented fight: does TS accept an object as a key?
export const objectKeyForge = defineForge<GithubClient>()({
	id: "obj-key",
	produces: {
		[accountAge]: async () => 1,
	},
});
