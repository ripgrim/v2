// The consumer module: imports the destructured surface from the config file.
// Narrowing and comparison constraints must survive the re-import.
import { is, matches, under } from "./fixture.ts";
import { rule, signals } from "./tripwire.config.github.ts";
import {
	rule as joeRule,
	signals as joeSignals,
} from "./tripwire.config.joe.ts";

// --- Mechanism 1: comparison constrained to the signal's value type ---------

export const oldEnough = rule("account age", {
	when: signals.contributor.accountAge, // number signal
	comparison: under(7),
	severity: "medium",
});

export const nameLooksReal = rule("display name", {
	when: signals.contributor.displayName, // text signal
	comparison: matches(/\w{2,}/),
	severity: "low",
});

export const firstTimer = rule("first contribution", {
	when: signals.pr.isFirstContribution, // boolean signal
	comparison: is(true),
	severity: "high",
});

export const badTextOnNumber = rule("bad", {
	when: signals.contributor.accountAge,
	// @ts-expect-error matches() is for text signals; accountAge is a number signal
	comparison: matches(/x/),
	severity: "low",
});

export const badNumberOnText = rule("bad", {
	when: signals.contributor.displayName,
	// @ts-expect-error under() is for number signals; displayName is a text signal
	comparison: under(3),
	severity: "low",
});

export const badBoolOnNumber = rule("bad", {
	when: signals.contributor.accountAge,
	// @ts-expect-error is() is for boolean signals; accountAge is a number signal
	comparison: is(true),
	severity: "low",
});

// --- Mechanism 2: forge binding narrows the signal surface ------------------

// forgeJoe has no accountAge producer, so the signal is absent from its type.
// @ts-expect-error accountAge is not on forgeJoe's signal surface
export const unsupported = joeSignals.contributor.accountAge;

// The signals forgeJoe does produce are present and fully typed.
export const joeName = joeRule("display name via joe", {
	when: joeSignals.contributor.displayName,
	comparison: matches(/\w+/),
	severity: "low",
});

export const joeFirstTimer = joeRule("first pr via joe", {
	when: joeSignals.pr.isFirstContribution,
	comparison: is(true),
	severity: "medium",
});

// And the comparison constraint still holds on the joe surface.
export const joeBad = joeRule("bad", {
	when: joeSignals.contributor.displayName,
	// @ts-expect-error under() is for number signals
	comparison: under(1),
	severity: "low",
});

// Rule output is pure keyless data.
export const proofOfPureData: {
	name: string;
	signal: string;
	comparison: { kind: string; args: readonly unknown[] };
	severity: "low" | "medium" | "high";
} = oldEnough;
