import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "#/components/ui/sonner";
import { automodRulesQueryOptions } from "#/lib/automod.query";
import type {
	AutomodMatch,
	AutomodRule,
	MatchVerdict,
} from "#/lib/automod.types";

/**
 * Optimistic automod mutations. The rules query is the source of truth, so
 * toggles and match verdicts just rewrite the cached list — no backend needed.
 */
export function useAutomodActions() {
	const queryClient = useQueryClient();
	const { queryKey } = automodRulesQueryOptions();

	const setRules = useCallback(
		(updater: (rules: AutomodRule[]) => AutomodRule[]) => {
			queryClient.setQueryData<AutomodRule[]>(queryKey, (prev) =>
				updater(prev ?? []),
			);
		},
		[queryClient, queryKey],
	);

	const toggleRule = useCallback(
		(rule: AutomodRule) => {
			const next = !rule.enabled;
			setRules((rules) =>
				rules.map((entry) =>
					entry.id === rule.id ? { ...entry, enabled: next } : entry,
				),
			);
			toast.success(`${next ? "Enabled" : "Disabled"} “${rule.name}”`);
		},
		[setRules],
	);

	const resolveMatch = useCallback(
		(rule: AutomodRule, match: AutomodMatch, verdict: MatchVerdict) => {
			setRules((rules) =>
				rules.map((entry) =>
					entry.id === rule.id
						? {
								...entry,
								recentMatches: entry.recentMatches.map((m) =>
									m.id === match.id ? { ...m, verdict } : m,
								),
							}
						: entry,
				),
			);
			toast.success(
				verdict === "false-positive"
					? "Marked as false positive"
					: "Match confirmed",
			);
		},
		[setRules],
	);

	return { toggleRule, resolveMatch };
}
