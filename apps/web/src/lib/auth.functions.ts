import { createServerFn } from "@tanstack/react-start";

export interface SessionInfo {
	/** null when signed out; "disabled" when auth env is absent (local dev). */
	user: { id: string; name: string; image: string | null } | null;
	authEnabled: boolean;
}

export const getSessionInfo = createServerFn({ method: "GET" }).handler(
	async (): Promise<SessionInfo> => {
		const { getAuth } = await import("#/lib/server/auth");
		const auth = getAuth();
		if (!auth) {
			return { user: null, authEnabled: false };
		}
		const { getStartContext } = await import("@tanstack/start-storage-context");
		const { request } = getStartContext();
		const session = await auth.api.getSession({ headers: request.headers });
		return {
			user: session
				? {
						id: session.user.id,
						name: session.user.name,
						image: session.user.image ?? null,
					}
				: null,
			authEnabled: true,
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
