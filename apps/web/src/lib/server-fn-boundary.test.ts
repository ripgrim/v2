import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Structural authz boundary (invariant 3). Server functions are HTTP endpoints;
 * every one that returns product data MUST be access-gated (`gatedServerFn`).
 * This test scans the source and fails if a server function uses bare
 * `createServerFn` without being on the explicit public allowlist — so the
 * NEXT server function someone adds can't silently ship ungated. Deny by
 * default, same posture as the CI boundary check.
 */

// Intentionally reachable without approval. Keep this list SMALL and justified.
const PUBLIC_ALLOWLIST = new Set([
	"getSessionInfo", // session/status — feeds the gate, queue screen, unauth
	"getCurrentUser", // caller's OWN identity (name/login/avatar); no product data
	"getRun", // the unlisted-public run page — readable without a session by design
]);

const libDir = import.meta.dir;

interface ServerFn {
	name: string;
	builder: "createServerFn" | "gatedServerFn";
	file: string;
}

function discoverServerFns(): ServerFn[] {
	const found: ServerFn[] = [];
	for (const file of readdirSync(libDir)) {
		if (!file.endsWith(".functions.ts")) {
			continue;
		}
		const src = readFileSync(join(libDir, file), "utf8");
		const re = /export const (\w+)\s*=\s*(createServerFn|gatedServerFn)\(/g;
		let m: RegExpExecArray | null = re.exec(src);
		while (m !== null) {
			found.push({
				name: m[1] as string,
				builder: m[2] as ServerFn["builder"],
				file,
			});
			m = re.exec(src);
		}
	}
	return found;
}

describe("server-fn access boundary (invariant 3)", () => {
	const fns = discoverServerFns();

	test("discovers the server functions", () => {
		expect(fns.length).toBeGreaterThan(10);
	});

	test("every server function is gated or explicitly allowlisted", () => {
		const ungated = fns
			.filter(
				(f) => f.builder === "createServerFn" && !PUBLIC_ALLOWLIST.has(f.name),
			)
			.map((f) => `${f.file}:${f.name}`);
		// A non-empty list means someone added a product endpoint with bare
		// createServerFn — gate it (gatedServerFn) or, if truly public, add it to
		// PUBLIC_ALLOWLIST with a justification.
		expect(ungated).toEqual([]);
	});

	test("allowlisted functions exist and use bare createServerFn", () => {
		for (const name of PUBLIC_ALLOWLIST) {
			const f = fns.find((x) => x.name === name);
			expect(
				f,
				`allowlisted "${name}" not found — stale allowlist?`,
			).toBeDefined();
			expect(f?.builder).toBe("createServerFn");
		}
	});
});
