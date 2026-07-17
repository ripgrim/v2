import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { RuleConfigView } from "#/lib/rules.functions";
import { RuleCard } from "./rule-card";

const qc = new QueryClient();
function render(node: ReactNode): string {
	return renderToStaticMarkup(
		<QueryClientProvider client={qc}>{node}</QueryClientProvider>,
	);
}

const rule = (over: Partial<RuleConfigView> = {}): RuleConfigView => ({
	ruleId: "account-age",
	version: 1,
	held: false,
	changeNote: null,
	name: "account age",
	blurb: "the contributor's account must be old enough.",
	enabled: true,
	config: { minDays: 7 },
	defaultConfig: { minDays: 7 },
	managedByWorkflow: false,
	optIn: false,
	matches24h: 0,
	trend: [],
	...over,
});

const base = { org: "o", repoId: "r", canEdit: true };

/**
 * §9 hierarchy pass — the layout invariants the founder review asked for.
 */
describe("RuleCard layout & hierarchy", () => {
	test("no per-card 'managed by your workflow' badge — that moved to the page banner", () => {
		const html = render(
			<RuleCard {...base} rule={rule({ managedByWorkflow: true })} />,
		);
		expect(html).not.toContain("managed by your workflow");
	});

	test("no per-card 'edit in workflow' link — that lives on the page banner", () => {
		const html = render(
			<RuleCard {...base} rule={rule({ managedByWorkflow: true })} />,
		);
		expect(html).not.toContain("edit in workflow");
	});

	test("the 'change request' scope chip is gone (scope is page-level)", () => {
		expect(render(<RuleCard {...base} rule={rule()} />)).not.toContain(
			"change request",
		);
	});

	test("view raw renders in the footer actions zone, not the data column", () => {
		expect(render(<RuleCard {...base} rule={rule()} />)).toContain("view raw");
	});

	test("verdict state is muted text, never a red chip (red is reserved for activity)", () => {
		const html = render(<RuleCard {...base} rule={rule({ enabled: true })} />);
		expect(html).toContain(">block<");
		expect(html).not.toContain("bg-red-500/10");
	});

	test("the 24h count reddens only when blocks actually fired", () => {
		expect(
			render(<RuleCard {...base} rule={rule({ matches24h: 3 })} />),
		).toContain("text-red-600");
		expect(
			render(<RuleCard {...base} rule={rule({ matches24h: 0 })} />),
		).not.toContain("text-red-600");
	});

	test("an opt-in-off rule keeps a DISTINCT enable offer, not a bare toggle", () => {
		const html = render(
			<RuleCard
				{...base}
				rule={rule({
					ruleId: "ai-review",
					name: "ai review",
					optIn: true,
					enabled: false,
					blurb: "off until you turn it on — ai review costs tokens.",
					config: { maxSteps: 12 },
					defaultConfig: { maxSteps: 12 },
				})}
			/>,
		);
		expect(html).toContain("enable");
		// the COGS framing survives in the body while it's still an offer
		expect(html).toContain("costs tokens");
	});

	test("a param-less rule shows its blurb and no config footer", () => {
		const html = render(
			<RuleCard
				{...base}
				rule={rule({
					ruleId: "crypto-address",
					name: "crypto address",
					blurb: "blocks cryptocurrency addresses.",
					config: {},
					defaultConfig: {},
				})}
			/>,
		);
		expect(html).toContain("blocks cryptocurrency addresses.");
		expect(html).not.toContain("view raw");
	});
});
