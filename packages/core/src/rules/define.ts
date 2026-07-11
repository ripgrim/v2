import type { RuleResult } from "@tripwire/contracts";
import type { z } from "zod";
import type { RuleContext } from "../context.ts";

/**
 * The rule primitive (§6): a single boolean requirement with a Zod config
 * schema, a Zod evidence schema, and a pure `evaluate`. Expected outcomes are
 * VALUES — a rule that can't evaluate returns skipped; throws are bugs.
 */

export type RuleOutcome<TEvidence> =
	| { status: "evaluated"; passed: boolean; evidence: TEvidence }
	| { status: "skipped"; reason: string };

export interface RuleDefinition<
	TConfig extends z.ZodType = z.ZodType,
	TEvidence extends z.ZodType = z.ZodType,
> {
	/** kebab-case, versionless; the wire id is `id@version`. */
	id: string;
	version: number;
	configSchema: TConfig;
	resultSchema: TEvidence;
	evaluate(
		ctx: RuleContext,
		config: z.infer<TConfig>,
	): RuleOutcome<z.infer<TEvidence>> | Promise<RuleOutcome<z.infer<TEvidence>>>;
}

const RULE_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function defineRule<
	TConfig extends z.ZodType,
	TEvidence extends z.ZodType,
>(
	rule: RuleDefinition<TConfig, TEvidence>,
): RuleDefinition<TConfig, TEvidence> {
	if (!RULE_ID.test(rule.id)) {
		throw new Error(`rule id must be kebab-case: ${rule.id}`);
	}
	if (!Number.isInteger(rule.version) || rule.version < 1) {
		throw new Error(`rule version must be a positive integer: ${rule.id}`);
	}
	return rule;
}

/** The wire reference for a rule: `account-age@1`. */
export function ruleRef(rule: Pick<RuleDefinition, "id" | "version">): string {
	return `${rule.id}@${rule.version}`;
}

/**
 * Runs a rule over a context with an UNVALIDATED config (JSON off the wire),
 * producing the serialized RuleResult envelope. Config parse failure and
 * evidence validation failure are skipped results, not throws — one bad
 * config degrades one rule, never the run.
 */
export async function evaluateRule(
	rule: RuleDefinition,
	ctx: RuleContext,
	config: unknown,
): Promise<RuleResult> {
	const base = { ruleId: rule.id, version: rule.version, evaluatedAt: ctx.now };
	const parsedConfig = rule.configSchema.safeParse(config);
	if (!parsedConfig.success) {
		return {
			...base,
			status: "skipped",
			passed: false,
			evidence: null,
			reason: `invalid config: ${parsedConfig.error.message}`,
		};
	}
	const outcome = await rule.evaluate(ctx, parsedConfig.data);
	if (outcome.status === "skipped") {
		return {
			...base,
			status: "skipped",
			passed: false,
			evidence: null,
			reason: outcome.reason,
		};
	}
	const evidence = rule.resultSchema.safeParse(outcome.evidence);
	if (!evidence.success) {
		return {
			...base,
			status: "skipped",
			passed: false,
			evidence: null,
			reason: `evidence failed schema: ${evidence.error.message}`,
		};
	}
	return {
		...base,
		status: "evaluated",
		passed: outcome.passed,
		evidence: evidence.data,
	};
}
