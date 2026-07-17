import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ruleUiSchema } from "@tripwire/contracts";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkline } from "#/components/charts/dither-kit";
import { ParamSentence } from "#/components/rules-params/param-sentence";
import { RawConfigDisclosure } from "#/components/rules-params/raw-config-disclosure";
import { Switch } from "#/components/ui/switch";
import {
	type RuleConfigView,
	saveRuleConfig,
	upgradeRuleConfig,
} from "#/lib/rules.functions";
import { rulesQueryKeys } from "#/lib/rules.query";
import { cn } from "#/lib/utils";

/**
 * One rule as a header/body card (§9), a sibling of the activity cards:
 *
 * - HEADER (surface fill) — identity + state + activity: a state dot, the rule
 *   name, the quiet `block` verdict slot (muted text today; it earns colour when
 *   warn/log verdicts differentiate — red stays reserved for activity), then the
 *   24h activity (sparkline + count, the count reddening when blocks actually
 *   fired) and the enable Switch. An opt-in-off rule shows a DISTINCT "enable"
 *   offer instead (§8 — the COGS gate for ai-review, a considered click, not a
 *   symmetric toggle); a workflow-managed set shows no toggle at all.
 * - BODY (card base) — the payload: the param sentence with configured values,
 *   or the blurb for a param-less / not-yet-enabled rule, plus the held prompt.
 * - FOOTER — `view raw`, a quiet subordinate action, out of the data column.
 *
 * Scope ("change request") is uniform across rules ⇒ page-level, not a per-card
 * chip; "managed by your workflow" is repo-level ⇒ one page banner, not N badges.
 */
export function RuleCard({
	org,
	repoId,
	rule,
	canEdit,
}: {
	/** Org slug from the URL. */
	org: string;
	repoId: string;
	rule: RuleConfigView;
	/** Caller is an org admin — gates the inline config editors (§9). */
	canEdit: boolean;
}) {
	const queryClient = useQueryClient();
	const [enabled, setEnabled] = useState(rule.enabled);
	const hasTrend = rule.trend.some((n) => n > 0);
	/** An opt-in rule that's off is an OFFER, not a silently-disabled toggle. */
	const offering = rule.optIn && !enabled && !rule.managedByWorkflow;
	const paramCount = ruleUiSchema(rule.ruleId)?.params.length ?? 0;
	/** Configurable + actually configurable now (not an unclaimed opt-in offer). */
	const showConfig = paramCount > 0 && !offering;

	const mutation = useMutation({
		mutationFn: saveRuleConfig,
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: rulesQueryKeys.config(org, repoId),
			}),
	});

	const upgrade = useMutation({
		mutationFn: upgradeRuleConfig,
		onSettled: () =>
			queryClient.invalidateQueries({
				queryKey: rulesQueryKeys.config(org, repoId),
			}),
		onSuccess: (result) => {
			toast(
				result && "error" in result ? result.error : `${rule.name} updated`,
			);
		},
	});

	// One write path (§9): a typed config object straight to the admin-gated
	// mutation — no freeform JSON parsing. Param edits merge one key; the toggle
	// re-sends the current config unchanged.
	const saveConfig = (nextEnabled: boolean, config: unknown) => {
		mutation.mutate(
			{
				data: {
					org,
					repoId,
					ruleId: rule.ruleId,
					enabled: nextEnabled,
					config: config as never,
				},
			},
			{
				onSuccess: (result) => {
					toast(
						result && "error" in result ? result.error : `${rule.name} saved`,
					);
				},
			},
		);
	};
	const asObject = (c: unknown): Record<string, unknown> =>
		typeof c === "object" && c !== null ? (c as Record<string, unknown>) : {};

	return (
		<div className="overflow-hidden rounded-xl border bg-card">
			{/* HEADER — identity + verdict state + activity + toggle */}
			<div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 bg-surface-1 px-4 py-2">
				<span className="font-medium text-sm">{rule.name}</span>
				{/* verdict slot — muted text; earns colour when verdicts differentiate. */}
				<span
					className={cn(
						"text-xs",
						enabled ? "text-muted-foreground" : "text-muted-foreground/50",
					)}
				>
					block
				</span>

				<div className="ml-auto flex shrink-0 items-center gap-4">
					{hasTrend ? (
						<div className="hidden h-7 w-20 sm:block">
							<Sparkline bloom="aura" color="blue" data={rule.trend} />
						</div>
					) : null}
					<div className="w-10 text-right">
						<p
							className={cn(
								"font-medium text-sm tabular-nums leading-none",
								rule.matches24h > 0
									? "text-red-600 dark:text-red-400"
									: "text-foreground",
							)}
						>
							{rule.matches24h}
						</p>
						<p className="mt-1 text-[11px] text-muted-foreground">24h</p>
					</div>
					{rule.managedByWorkflow ? null : offering ? (
						<button
							className="rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/90"
							onClick={() => {
								setEnabled(true);
								saveConfig(true, rule.config);
							}}
							type="button"
						>
							enable
						</button>
					) : (
						<Switch
							checked={enabled}
							onCheckedChange={(next) => {
								setEnabled(next);
								saveConfig(next, rule.config);
							}}
						/>
					)}
				</div>
			</div>

			{/* BODY — the payload */}
			<div className="px-4 py-3">
				{showConfig ? (
					<ParamSentence
						canEdit={canEdit && !rule.managedByWorkflow}
						config={rule.config}
						onSaveParam={(key, value) =>
							saveConfig(enabled, { ...asObject(rule.config), [key]: value })
						}
						ruleId={rule.ruleId}
					/>
				) : (
					<p className="text-muted-foreground text-xs leading-relaxed">
						{rule.blurb}
					</p>
				)}

				{rule.held ? (
					<div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
						<span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
							update held
						</span>
						<span className="text-muted-foreground">
							{rule.changeNote ? `${rule.changeNote} — ` : ""}your saved
							settings don't carry over; re-confirm to move to the new version.
						</span>
						<button
							className="font-medium text-primary hover:underline disabled:opacity-50"
							disabled={upgrade.isPending}
							onClick={() =>
								upgrade.mutate({ data: { org, repoId, ruleId: rule.ruleId } })
							}
							type="button"
						>
							re-confirm
						</button>
					</div>
				) : null}
			</div>

			{/* FOOTER — subordinate action, out of the data column */}
			{showConfig ? (
				<div className="flex justify-end px-4 pb-2.5">
					<RawConfigDisclosure config={rule.config} />
				</div>
			) : null}
		</div>
	);
}
