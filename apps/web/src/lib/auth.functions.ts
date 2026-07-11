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
