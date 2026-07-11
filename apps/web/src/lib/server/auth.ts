import { type Auth, createAuth, resolveAuthPosture } from "@tripwire/db";
import { getDb } from "#/lib/server/db";

/**
 * The web head's Better Auth instance — same config, same database as the api
 * head's handler; sessions written there validate here. null when auth env is
 * absent (local dev before the OAuth app exists — see VERIFICATION-QUEUE).
 */
let instance: Auth | null | undefined;

export function getAuth(): Auth | null {
	if (instance !== undefined) {
		return instance;
	}
	const secret = process.env.BETTER_AUTH_SECRET;
	const posture = resolveAuthPosture({
		secret,
		nodeEnv: process.env.NODE_ENV,
	});
	if (posture === "open-dev" || !secret) {
		instance = null;
		return instance;
	}
	const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
	const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
	instance = createAuth({
		db: getDb().db,
		secret,
		baseUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
		github: clientId && clientSecret ? { clientId, clientSecret } : null,
	});
	return instance;
}
