import type { RepoScopedEvent } from "@tripwire/contracts";
import type { SignalRegistry } from "./registry.ts";
import type { SignalValue } from "./signal.ts";

/**
 * A forge implements signals by writing producers. defineForge is
 * credential-free: `ctx.forge` is the forge's native client, already
 * authenticated by the backend at evaluation time. Producers never see a
 * token. `ctx.load` memoizes fetches so producers that share one API call
 * (one user fetch feeding five contributor signals) dedupe automatically.
 */

export interface ForgeSignalCtx<Client> {
	/** The forge's native client, pre-authenticated by the backend. */
	readonly forge: Client;
	/** The event under evaluation: repo, actor, change request, comment. */
	readonly event: RepoScopedEvent;
	/** ISO evaluation clock. Time is an input, so producers stay deterministic. */
	readonly now: string;
	/**
	 * Memoized fetch. Producers sharing a key share one in-flight call and one
	 * result for the lifetime of this evaluation context.
	 */
	load<V>(key: string, fetch: () => Promise<V>): Promise<V>;
}

export type SignalProducer<Client, S> = (
	ctx: ForgeSignalCtx<Client>,
) => SignalValue<S> | Promise<SignalValue<S>>;

/**
 * One optional producer per registry signal, keyed by the signal's id.
 * Writing a producer is declaring support; the return type is enforced
 * against the signal's declared value type.
 */
export type ProducerMap<Client> = {
	[Id in keyof SignalRegistry]?: SignalProducer<Client, SignalRegistry[Id]>;
};

/** The value sets a forge can offer as builder suggestions. */
export type SuggestionKind = "branches" | "extensions" | "logins";

/** Repo-scoped context for a suggester: no event, just the pre-authed client. */
export interface ForgeSuggestCtx<Client> {
	/** The forge's native client, pre-authenticated by the backend. */
	readonly forge: Client;
	/** The repo whose values to suggest, forge-native form (owner/name). */
	readonly repo: string;
}

/**
 * One optional suggester per suggestion kind. Capability by omission at two
 * levels: a forge may omit `suggest` entirely, or omit individual kinds. A
 * missing suggester means the builder falls back to a plain input.
 */
export type SuggesterMap<Client> = Partial<
	Record<SuggestionKind, (ctx: ForgeSuggestCtx<Client>) => Promise<string[]>>
>;

export interface ForgeDefinition<
	Client,
	P extends ProducerMap<Client>,
	FId extends string = string,
> {
	/** Literal-typed: the client brands its surface with it, so a signal bound
	 * to one forge cannot be passed to another forge's rule(). */
	readonly id: FId;
	readonly produces: P;
	/** Optional value suggesters, keyed by suggestion kind. */
	readonly suggest?: SuggesterMap<Client>;
}

/**
 * `never` for Client: producers take ctx contravariantly, so every concrete
 * forge is assignable to AnyForgeDefinition but not to a Client=unknown one.
 */
export type AnyForgeDefinition = ForgeDefinition<never, ProducerMap<never>>;

/** Curried so Client is explicit while the producer map stays inferred. */
export function defineForge<Client>() {
	return <P extends ProducerMap<Client>, FId extends string>(def: {
		id: FId;
		produces: P;
		suggest?: SuggesterMap<Client>;
	}): ForgeDefinition<Client, P, FId> => def;
}

/**
 * Builds the evaluation context for one run: binds the pre-authed client,
 * the event, the clock, and a fresh memo table. The promise itself is
 * cached, so concurrent producers coalesce onto one in-flight fetch and a
 * failed fetch fails every dependent signal instead of retrying.
 */
export function createForgeSignalCtx<Client>(input: {
	forge: Client;
	event: RepoScopedEvent;
	now: string;
}): ForgeSignalCtx<Client> {
	const memo = new Map<string, Promise<unknown>>();
	return {
		forge: input.forge,
		event: input.event,
		now: input.now,
		load<V>(key: string, fetch: () => Promise<V>): Promise<V> {
			const cached = memo.get(key);
			if (cached) {
				return cached as Promise<V>;
			}
			const pending = fetch();
			memo.set(key, pending);
			return pending;
		},
	};
}
