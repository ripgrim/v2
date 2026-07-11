import type { Auth } from "@tripwire/auth/server";
import type { Db } from "@tripwire/db";
import type { Pool } from "pg";
import type { PgBoss } from "pg-boss";
import type { Logger } from "pino";

/** Dependencies injected into every route via context — testable by design. */
export interface ApiDeps {
	/**
	 * Session validation for browser-facing endpoints (SSE). null ⇒ dev open
	 * posture (no BETTER_AUTH_SECRET); production refuses to boot instead
	 * (resolveAuthPosture).
	 */
	auth: Auth | null;
	db: Db;
	pool: Pool;
	boss: PgBoss;
	webhookSecret: string;
	/** Allowed CORS origin for the SSE stream (the web dashboard). */
	webOrigin: string;
	logger: Logger;
}

export interface ApiEnv {
	Variables: {
		deps: ApiDeps;
	};
}
