import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * CSRF-safe install `state` (§10 onboarding). The install URL carries a state
 * that HMAC-binds the initiating user; the Setup URL callback only links an
 * installation when the state's user matches the signed-in session. An attacker
 * can't forge a state for a victim's id (no secret), so they can't trick a
 * logged-in victim into claiming a foreign installation. Server-only (Node
 * crypto; never bundled to the client).
 */

function secret(): string {
	// In open-dev there's no auth and no install flow; a constant keeps the
	// helper total. Real installs run with BETTER_AUTH_SECRET set.
	return process.env.BETTER_AUTH_SECRET ?? "tripwire-open-dev-install-state";
}

export function signInstallState(userId: string): string {
	const payload = Buffer.from(userId).toString("base64url");
	const mac = createHmac("sha256", secret())
		.update(payload)
		.digest("base64url");
	return `${payload}.${mac}`;
}

/** The bound user id, or null when the state is missing/forged. */
export function verifyInstallState(state: string | undefined): string | null {
	if (!state) {
		return null;
	}
	const [payload, mac] = state.split(".");
	if (!payload || !mac) {
		return null;
	}
	const expected = createHmac("sha256", secret())
		.update(payload)
		.digest("base64url");
	const got = Buffer.from(mac);
	const want = Buffer.from(expected);
	if (got.length !== want.length || !timingSafeEqual(got, want)) {
		return null;
	}
	return Buffer.from(payload, "base64url").toString();
}
