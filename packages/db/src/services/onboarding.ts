import type { Db } from "../client.ts";

/**
 * LEGACY module (pre-org §10). The user→installation→active-repo model is
 * gone — orgs own installations (services/organizations.ts) and the URL owns
 * scope (§8). What remains here are the repo view TYPES shared by the org
 * services, kept at their historical import path.
 */

/** §4 repo switcher row — a name plus SIGNAL, so the switcher is triage. */
export interface SwitcherRepo {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	armed: boolean;
	pendingModeration: number;
	blocked24h: number;
	lastActivityAt: string | null;
}

export interface RepoLite {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	private: boolean;
	/** §4 — false ⇒ scoped for viewing but not gating; drives the arm CTA. */
	armed: boolean;
	/** §4 arm-time backfill progress; non-null total ⇒ a replay is in flight. */
	backfillTotal: number | null;
	backfillDone: number | null;
}

/** Kept so the module stays a module with a Db import for type parity. */
export type { Db };
