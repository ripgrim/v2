import type { AccessStatus } from "@tripwire/contracts";

/**
 * Pure access-queue decision helpers — no DB/env/SDK side effects, so they're
 * unit-testable and shared between the auth create hook and the web access
 * gate. Ported from tripwire v1.
 */

/**
 * Force server-assigned access defaults onto a new signup, regardless of client
 * input. New signups always land as "pending"; pairs with `input: false` on the
 * Better Auth additionalFields.
 */
export function applySignupAccessDefaults<T extends object>(
	input: T,
	waitlistedAt: Date | null,
): T & { accessStatus: AccessStatus; waitlistedAt: Date | null } {
	return {
		...input,
		accessStatus: "pending",
		waitlistedAt,
	} as T & { accessStatus: AccessStatus; waitlistedAt: Date | null };
}

/**
 * Databuddy flag reasons that mean "not authoritatively resolved" — the flag
 * doesn't exist, the service errored, or the session isn't ready. In these
 * cases fall back to the env kill-switch rather than trust the (false)
 * `enabled` value. A thrown getFlag rejection maps to `null`.
 */
export const GATE_FALLBACK_REASONS = new Set([
	"ERROR",
	"NOT_FOUND",
	"SESSION_PENDING",
]);

/**
 * Resolve the access gate from a Databuddy flag result, falling back to the env
 * kill-switch when Databuddy couldn't authoritatively resolve it.
 */
export function gateFromFlag(
	flag: { enabled: boolean; reason: string } | null | undefined,
	envFallback: boolean,
): boolean {
	if (!flag || GATE_FALLBACK_REASONS.has(flag.reason)) return envFallback;
	return flag.enabled;
}

export interface AccessDenial {
	code: "FORBIDDEN";
	message: string;
}

/**
 * The gate decision for a resolved status. `null` when the user may proceed
 * (approved), or a FORBIDDEN denial for pending/rejected.
 */
export function accessDenialFor(status: AccessStatus): AccessDenial | null {
	if (status === "approved") return null;
	return {
		code: "FORBIDDEN",
		message:
			status === "rejected"
				? "Your access request was not approved."
				: "Your access request is still pending review.",
	};
}
