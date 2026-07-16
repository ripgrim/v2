import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Input } from "./input";

/**
 * Regression guard for the reported "SSR hydration mismatch: nondeterministic
 * clip-path/filter on ui primitives".
 *
 * Diagnosis (see the fix report): the primitives do NOT generate those styles —
 * SSR HTML is styleless and a clean, extension-free browser shows zero hydration
 * warnings. The clip-path/drop-shadow the reporter saw on Card/Input/Button was
 * injected client-side by a browser extension (password manager / Grammarly),
 * not our code.
 *
 * This test locks that property in: the shared primitives must be pure functions
 * of their props — identical output across renders (no per-render randomness)
 * and no clip-path/filter/drop-shadow inline styles. If a future change makes a
 * primitive emit a measured/random style, SSR and client can disagree; this
 * fails first, at the source, before it reaches a page.
 */

const CASES = [
	{ name: "Button", node: <Button>Save</Button> },
	{ name: "Input", node: <Input placeholder="name" /> },
	{
		name: "Card",
		node: (
			<Card>
				<CardContent>content</CardContent>
			</Card>
		),
	},
] as const;

describe("ui primitives are SSR-deterministic and style-clean", () => {
	for (const { name, node } of CASES) {
		test(`${name}: two renders with identical props are byte-identical`, () => {
			// Catches Math.random / per-render seeding regardless of style shape.
			expect(renderToStaticMarkup(node)).toBe(renderToStaticMarkup(node));
		});

		test(`${name}: emits no nondeterministic clip-path/filter style`, () => {
			expect(renderToStaticMarkup(node)).not.toMatch(
				/clip-?path|drop-shadow|filter:/i,
			);
		});
	}
});
