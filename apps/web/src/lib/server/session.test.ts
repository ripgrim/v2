import { describe, expect, test } from "bun:test";
import { assertSession } from "#/lib/server/session";

/**
 * §10 — mutating controls (approve/deny) and list-shaped server functions
 * answer 401 without a session; open-dev posture keeps the gate open.
 */
describe("assertSession", () => {
	test("auth enabled + no session ⇒ throws 401", () => {
		try {
			assertSession({ authEnabled: true, userId: null });
			throw new Error("expected a 401 response");
		} catch (error) {
			expect(error).toBeInstanceOf(Response);
			expect((error as Response).status).toBe(401);
		}
	});

	test("session ⇒ passes", () => {
		expect(() =>
			assertSession({ authEnabled: true, userId: "user-1" }),
		).not.toThrow();
	});

	test("open-dev posture (auth disabled) ⇒ passes", () => {
		expect(() =>
			assertSession({ authEnabled: false, userId: null }),
		).not.toThrow();
	});
});
