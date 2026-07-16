import { createServerFn } from "@tanstack/react-start";
import type { AccessStatus } from "@tripwire/contracts";

export interface SessionInfo {
	/** null when signed out; "disabled" when auth env is absent (local dev). */
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
		/** Closed-beta access queue status (server-assigned). */
		accessStatus: AccessStatus;
	} | null;
	authEnabled: boolean;
	/**
	 * Has the user finished onboarding (an active repo, §10)? Always true in
	 * open-dev / signed-out — the onboarding gate only applies to a real
	 * signed-in user, the same shape as the auth gate.
	 */
	onboarded: boolean;
	/**
	 * Is the closed-beta gate on? Server-evaluated (Databuddy `access-gate` flag
	 * + env fallback) — the SAME decision the API boundary enforces, so the
	 * route gate can never disagree with what the server actually blocks.
	 */
	gateEnabled: boolean;
}

export const getSessionInfo = createServerFn({ method: "GET" }).handler(
	async (): Promise<SessionInfo> => {
		const { getAuth } = await import("#/lib/server/auth");
		const auth = getAuth();
		if (!auth) {
			return {
				user: null,
				authEnabled: false,
				onboarded: true,
				gateEnabled: false,
			};
		}
		const { getStartContext } = await import("@tanstack/start-storage-context");
		const { request } = getStartContext();
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			return {
				user: null,
				authEnabled: true,
				onboarded: false,
				gateEnabled: false,
			};
		}
		const { onboardingServices, user: userTable } = await import(
			"@tripwire/db"
		);
		const { getDb } = await import("#/lib/server/db");
		const { eq } = await import("drizzle-orm");
		const { isAccessGateEnabled } = await import("@tripwire/auth/access-gate");
		const db = getDb().db;
		const activeRepo = await onboardingServices.getActiveRepo(
			db,
			session.user.id,
		);
		const rows = await db
			.select({ accessStatus: userTable.accessStatus })
			.from(userTable)
			.where(eq(userTable.id, session.user.id))
			.limit(1);
		const accessStatus: AccessStatus = rows[0]?.accessStatus ?? "pending";
		const gateEnabled = await isAccessGateEnabled({
			userId: session.user.id,
			email: session.user.email,
		});
		return {
			user: {
				id: session.user.id,
				name: session.user.name,
				email: session.user.email,
				image: session.user.image ?? null,
				accessStatus,
			},
			authEnabled: true,
			onboarded: activeRepo !== null,
			gateEnabled,
		};
	},
);

/**
 * The signed-in maintainer as the topbar shows them (§10). Null in open-dev
 * (no auth env) or signed out — the topbar renders a placeholder, never a
 * fabricated identity. `login` is the forge handle from `forge_identities`.
 */
export interface CurrentUser {
	name: string;
	login: string;
	image: string | null;
}

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<CurrentUser | null> => {
		const { getAuth } = await import("#/lib/server/auth");
		const auth = getAuth();
		if (!auth) {
			return null;
		}
		const { getStartContext } = await import("@tanstack/start-storage-context");
		const session = await auth.api.getSession({
			headers: getStartContext().request.headers,
		});
		if (!session) {
			return null;
		}
		const { getDb } = await import("#/lib/server/db");
		const { forgeIdentities } = await import("@tripwire/db");
		const { eq } = await import("drizzle-orm");
		const rows = await getDb()
			.db.select({ username: forgeIdentities.username })
			.from(forgeIdentities)
			.where(eq(forgeIdentities.userId, session.user.id))
			.limit(1);
		return {
			name: session.user.name,
			login: rows[0]?.username ?? session.user.name,
			image: session.user.image ?? null,
		};
	},
);
