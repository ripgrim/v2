import { createMiddleware, createServerFn } from "@tanstack/react-start";

/**
 * Access-gate function middleware — the real invariant-3 boundary for the web
 * head. Server functions are HTTP endpoints, so route-level gating (beforeLoad)
 * is only UX; THIS is what actually blocks a pending/rejected user from calling
 * product data directly.
 *
 * Open-dev posture (no BETTER_AUTH_SECRET → auth null) stands open, like the
 * rest of the stack. Otherwise: no session → reject; gate on + not approved →
 * reject. Same server-side flag evaluation (`assertApproved`) the Hono SSE
 * endpoint uses, so web and API can't disagree.
 */
export const accessGuardMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	const { getAuth } = await import("#/lib/server/auth");
	const auth = getAuth();
	if (!auth) {
		return next();
	}
	const { getStartContext } = await import("@tanstack/start-storage-context");
	const session = await auth.api.getSession({
		headers: getStartContext().request.headers,
	});
	if (!session) {
		throw new Error("session required");
	}
	const { assertApproved } = await import("@tripwire/auth/access-gate");
	const { getDb } = await import("#/lib/server/db");
	const denial = await assertApproved(
		getDb().db,
		session.user.id,
		session.user.email,
	);
	if (denial) {
		throw new Error(denial.message);
	}
	return next();
});

/**
 * Access-gated server function builder. Use this for EVERY server function that
 * returns product/repo data. Bare `createServerFn` is reserved for the explicit
 * public allowlist (auth/session/identity + the unlisted-public run page),
 * enforced by `server-fn-boundary.test.ts`.
 */
export function gatedServerFn(options: { method: "GET" | "POST" }) {
	return createServerFn(options).middleware([accessGuardMiddleware]);
}
