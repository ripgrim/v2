/**
 * Signals are the forge-neutral facts rules read. A signal's `type` is a
 * RUNTIME value, not just a TS type param, so the registry stays
 * introspectable by the UI and the future AI composer. The phantom on the
 * value type is what carries the static type through the whole chain:
 * registry type -> producer return type -> signal value type -> comparison.
 */

export interface SignalValueType<T> {
	readonly kind: string;
	/** Phantom only. Never set at runtime; it carries T invariantly. */
	readonly "~signalValueType"?: (value: T) => T;
}

/** The SDK's value-type vocabulary. Every registry signal uses one of these. */
export const t = {
	number: { kind: "number" } as SignalValueType<number>,
	text: { kind: "text" } as SignalValueType<string>,
	boolean: { kind: "boolean" } as SignalValueType<boolean>,
	/** A list of plain strings, e.g. changed file paths. */
	textList: { kind: "textList" } as SignalValueType<readonly string[]>,
	/** ISO timestamps, newest first. */
	timestamps: { kind: "timestamps" } as SignalValueType<readonly string[]>,
	/** Text keyed by a location, e.g. diff patch text keyed by file path. */
	textMap: { kind: "textMap" } as SignalValueType<
		Readonly<Record<string, string>>
	>,
};

export type SignalScope = "contributor" | "repoRelation" | "pr" | "comment";

export interface Signal<Id extends string, T> {
	readonly id: Id;
	readonly scope: SignalScope;
	readonly type: SignalValueType<T>;
	readonly describe: string;
}

export type AnySignal = Signal<string, unknown>;

export type SignalValue<S> = S extends Signal<string, infer T> ? T : never;

export function defineSignal<Id extends string, T>(def: {
	id: Id;
	scope: SignalScope;
	type: SignalValueType<T>;
	describe: string;
}): Signal<Id, T> {
	return def;
}

/**
 * Thrown by a producer when the fact is honestly absent for this evaluation
 * (no comment on a push event, unparseable upstream data). The evaluation
 * layer turns it into the rule's skip, never a run failure.
 */
export class SignalUnavailableError extends Error {
	constructor(readonly reason: string) {
		super(reason);
		this.name = "SignalUnavailableError";
	}
}

export function signalUnavailable(reason: string): never {
	throw new SignalUnavailableError(reason);
}
